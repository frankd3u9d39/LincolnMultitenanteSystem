/**
 * Shared HTTP client for the Lincoln API.
 *
 * Every request carries the signed-in user's bearer token. A 401 means the
 * session is no longer valid, so the stored session is cleared and the app is
 * told to send the user back to sign in.
 */

import { clearSession, getToken } from '@/lib/auth/session';

export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? 'http://127.0.0.1:8000/api/v1').replace(/\/$/, '');

/** Fired on window when the API rejects the current token. */
export const UNAUTHENTICATED_EVENT = 'lincoln:unauthenticated';

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue>;

export class ApiError extends Error {
  readonly status: number;
  /** Field-level validation messages from a 422, keyed by field name. */
  readonly errors: Record<string, string[]>;
  readonly data: Record<string, unknown>;

  constructor(status: number, message: string, errors: Record<string, string[]> = {}, data: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.data = data;
  }

  /** The first message for a field, if the server reported one. */
  fieldError(field: string): string | undefined {
    return this.errors[field]?.[0];
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  signal?: AbortSignal;
  /** Skip the global sign-out on 401, for calls like sign-in itself. */
  public?: boolean;
}

function buildUrl(path: string, query?: Query): string {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);

  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

function authHeaders(isPublic: boolean): Record<string, string> {
  const token = isPublic ? null : getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { message: text.slice(0, 200) };
  }
}

async function send(path: string, options: RequestOptions): Promise<Response> {
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  try {
    return await fetch(buildUrl(path, options.query), {
      method: options.method ?? 'GET',
      signal: options.signal,
      headers: {
        Accept: 'application/json',
        ...(!isFormData && options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...authHeaders(Boolean(options.public)),
      },
      body: isFormData
        ? (options.body as FormData)
        : options.body !== undefined
        ? JSON.stringify(options.body)
        : undefined,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }
    throw new ApiError(0, 'Cannot reach the server. Check your connection and that the API is running.');
  }
}

async function fail(response: Response, isPublic: boolean): Promise<never> {
  const data = await parse(response);

  if (response.status === 401 && !isPublic) {
    clearSession();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(UNAUTHENTICATED_EVENT));
    }
  }

  throw new ApiError(
    response.status,
    typeof data.message === 'string' && data.message ? data.message : `Request failed (${response.status}).`,
    (data.errors as Record<string, string[]> | undefined) ?? {},
    data
  );
}

/** Calls the API and returns the parsed JSON body. */
export async function api<T = Record<string, unknown>>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options);

  if (!response.ok) {
    await fail(response, Boolean(options.public));
  }

  return (await parse(response)) as T;
}

/** Fetches a file from the API and hands it to the browser as a download. */
export async function apiDownload(path: string, query: Query = {}, fallbackName = 'download'): Promise<string> {
  const response = await send(path, { query });

  if (!response.ok) {
    await fail(response, false);
  }

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const fileName = match?.[1] ?? fallbackName;

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return fileName;
}

interface Paginated<T> {
  data: T[];
  meta?: { current_page?: number; last_page?: number; total?: number };
}

/** Reads every page of a paginated endpoint into one array. */
export async function fetchAllPages<T>(path: string, query: Query = {}, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  let page = 1;
  let lastPage = 1;

  do {
    const result = await api<Paginated<T>>(path, { query: { ...query, per_page: 100, page }, signal });
    items.push(...(result.data ?? []));
    lastPage = result.meta?.last_page ?? 1;
    page += 1;
  } while (page <= lastPage);

  return items;
}
