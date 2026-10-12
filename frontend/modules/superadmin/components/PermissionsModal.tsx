'use client';

import React, { useState } from 'react';
import { ApiError } from '@/services/api';
import { SchoolAdministrator } from '../types';
import { ADMIN_ROLE_LABELS } from '../utils';
import { getAdministratorPermissions, saveAdministratorPermissions } from '../services/api';
import { useAsync } from '../hooks';
import { ErrorBlock, LoadingBlock } from './LoadState';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';

interface PermissionsModalProps {
  admin: SchoolAdministrator;
  onClose: () => void;
  onSave: (summary: string) => void;
}

/**
 * Capability matrix for one administrator. The catalogue, the defaults for
 * their title and what they currently hold all come from the server.
 */
export function PermissionsModal({ admin, onClose, onSave }: PermissionsModalProps) {
  const { data, loading, error, reload } = useAsync((signal) => getAdministratorPermissions(admin.id, signal), [admin.id]);

  // null until the user touches a checkbox, so the loaded grant is the starting point.
  const [edited, setEdited] = useState<string[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const granted = edited ?? data?.granted ?? [];
  const baseline = data?.granted ?? [];
  const lockedKeys = new Set(
    (data?.groups ?? []).flatMap((group) =>
      group.capabilities.filter((capability) => capability.locked && admin.role === 'principal_admin').map((capability) => capability.key)
    )
  );
  const total = (data?.groups ?? []).reduce((sum, group) => sum + group.capabilities.length, 0);

  const added = granted.filter((key) => !baseline.includes(key)).length;
  const removed = baseline.filter((key) => !granted.includes(key)).length;
  const changed = added + removed > 0;

  const toggle = (key: string) => {
    if (lockedKeys.has(key)) {
      return;
    }
    setSaveError('');
    setEdited(granted.includes(key) ? granted.filter((item) => item !== key) : [...granted, key]);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError('');

    try {
      onSave(await saveAdministratorPermissions(admin.id, granted));
      onClose();
    } catch (failure) {
      setSaveError(failure instanceof ApiError ? failure.message : 'The permissions could not be saved.');
      setSaving(false);
    }
  };

  return (
    <ModalShell
      eyebrow="Access Control"
      title="Permission Matrix"
      subtitle={`${admin.fullName} • ${ADMIN_ROLE_LABELS[admin.role]} • ${admin.schoolName}`}
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={
        <>
          <ModalSecondaryButton onClick={() => setEdited(data?.defaults ?? null)} disabled={!data || saving}>
            Reset to Role Defaults
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={!changed || saving}>
            {saving ? 'Saving…' : 'Save Permissions'}
          </ModalPrimaryButton>
        </>
      }
    >
      {loading ? (
        <LoadingBlock rows={5} label="Loading permissions" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'Permissions could not be loaded.'} onRetry={reload} />
      ) : (
        <div className="space-y-5">
          {saveError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-between gap-3 text-[11px]">
            <span className="text-zinc-500">
              <span className="font-bold text-zinc-800">{granted.length}</span> of {total} capabilities granted
              {data.customised && <span className="ml-2 text-zinc-400">(customised for this person)</span>}
            </span>
            {changed && (
              <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
                Unsaved changes
              </span>
            )}
          </div>

          {data.groups.map((group) => (
            <div key={group.group}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">{group.group}</h3>
              <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
                {group.capabilities.map((capability) => {
                  const locked = lockedKeys.has(capability.key);
                  return (
                    <label
                      key={capability.key}
                      className={`flex items-start justify-between gap-4 px-3.5 py-3 transition-colors ${
                        locked ? 'cursor-not-allowed bg-zinc-50/60' : 'cursor-pointer hover:bg-zinc-50/60'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900">{capability.label}</span>
                          {locked && (
                            <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 text-[10px] font-bold uppercase">
                              Required
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] text-zinc-500 mt-0.5">{capability.description}</span>
                      </span>
                      <input
                        type="checkbox"
                        checked={granted.includes(capability.key)}
                        disabled={locked}
                        onChange={() => toggle(capability.key)}
                        className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0 disabled:opacity-50"
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}
