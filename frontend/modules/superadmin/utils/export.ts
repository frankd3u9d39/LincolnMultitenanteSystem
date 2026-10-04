// GROUP 4: SuperAdmin Module - client-side file export helpers

/** Escapes a single CSV cell, quoting it when it contains a delimiter, quote, or newline. */
function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Timestamp suffix for generated filenames, e.g. `2026-10-04_0842`. */
export function exportStamp(date: Date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}_${pad(
    date.getHours()
  )}${pad(date.getMinutes())}`;
}

/**
 * Builds a CSV from the given headers and rows and hands it to the browser as a download.
 * Returns the filename used so the caller can report it back to the user.
 */
export function downloadCsv(
  baseName: string,
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>
): string {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n');
  const fileName = `${baseName}_${exportStamp()}.csv`;

  // Prefixed with a BOM so Excel opens UTF-8 names and the ₦ sign correctly.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
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

/** Copies text to the clipboard, resolving false when the browser refuses. */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/** Generates a mock credential string of the given length. */
export function randomToken(length: number): string {
  const values = new Uint32Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => KEY_ALPHABET[value % KEY_ALPHABET.length]).join('');
}
