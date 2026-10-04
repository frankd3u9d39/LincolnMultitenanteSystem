'use client';

import React, { useState } from 'react';
import { SchoolAdministrator } from '../types';
import { ADMIN_ROLE_LABELS } from '../utils';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';

interface Capability {
  key: string;
  label: string;
  description: string;
  /** Roles granted this capability by default. */
  defaultRoles: SchoolAdministrator['role'][];
  /** Capabilities the principal admin can never give up. */
  locked?: boolean;
}

const CAPABILITY_GROUPS: Array<{ group: string; capabilities: Capability[] }> = [
  {
    group: 'People',
    capabilities: [
      { key: 'students.manage', label: 'Manage students', description: 'Enrol, edit, and withdraw student records.', defaultRoles: ['principal_admin', 'deputy_admin', 'registrar'] },
      { key: 'staff.manage', label: 'Manage staff', description: 'Add teachers and assign them to classes.', defaultRoles: ['principal_admin', 'deputy_admin'] },
      { key: 'admins.invite', label: 'Invite administrators', description: 'Create further administrator accounts for this school.', defaultRoles: ['principal_admin'], locked: true },
    ],
  },
  {
    group: 'Academics',
    capabilities: [
      { key: 'results.publish', label: 'Publish results', description: 'Release examination results to students and guardians.', defaultRoles: ['principal_admin', 'registrar'] },
      { key: 'timetable.edit', label: 'Edit timetable', description: 'Change class scheduling and room allocation.', defaultRoles: ['principal_admin', 'deputy_admin'] },
      { key: 'courses.manage', label: 'Manage courses', description: 'Create subjects, courses, and departments.', defaultRoles: ['principal_admin', 'deputy_admin', 'registrar'] },
    ],
  },
  {
    group: 'Finance',
    capabilities: [
      { key: 'fees.configure', label: 'Configure fees', description: 'Set fee structures and payment deadlines.', defaultRoles: ['principal_admin', 'bursar'] },
      { key: 'payments.reconcile', label: 'Reconcile payments', description: 'Match incoming payments against student invoices.', defaultRoles: ['principal_admin', 'bursar'] },
      { key: 'refunds.approve', label: 'Approve refunds', description: 'Authorise outgoing refunds from the school account.', defaultRoles: ['principal_admin'] },
    ],
  },
  {
    group: 'School Administration',
    capabilities: [
      { key: 'settings.edit', label: 'Edit school settings', description: 'Branding, sessions, grading scales, and policies.', defaultRoles: ['principal_admin'] },
      { key: 'reports.export', label: 'Export reports', description: 'Download school-wide academic and financial reports.', defaultRoles: ['principal_admin', 'deputy_admin', 'bursar', 'registrar'] },
      { key: 'audit.view', label: 'View audit log', description: 'Read the activity trail for this tenant boundary.', defaultRoles: ['principal_admin', 'deputy_admin'] },
    ],
  },
];

interface PermissionsModalProps {
  admin: SchoolAdministrator;
  onClose: () => void;
  onSave: (summary: string) => void;
}

/** Capability matrix for one administrator, seeded from their role defaults. */
export function PermissionsModal({ admin, onClose, onSave }: PermissionsModalProps) {
  const [granted, setGranted] = useState<string[]>(() =>
    CAPABILITY_GROUPS.flatMap((group) =>
      group.capabilities.filter((cap) => cap.defaultRoles.includes(admin.role)).map((cap) => cap.key)
    )
  );

  const baseline = CAPABILITY_GROUPS.flatMap((group) =>
    group.capabilities.filter((cap) => cap.defaultRoles.includes(admin.role)).map((cap) => cap.key)
  );

  const isLocked = (cap: Capability) => Boolean(cap.locked) && admin.role === 'principal_admin';

  const toggle = (cap: Capability) => {
    if (isLocked(cap)) return;
    setGranted((prev) => (prev.includes(cap.key) ? prev.filter((key) => key !== cap.key) : [...prev, cap.key]));
  };

  const added = granted.filter((key) => !baseline.includes(key)).length;
  const removed = baseline.filter((key) => !granted.includes(key)).length;
  const changed = added + removed > 0;

  const handleSave = () => {
    const parts: string[] = [];
    if (added > 0) parts.push(`${added} capability${added === 1 ? '' : ' grants'} added`);
    if (removed > 0) parts.push(`${removed} revoked`);
    onSave(`Permissions updated for ${admin.fullName}: ${parts.join(', ')}. Change written to the audit trail.`);
    onClose();
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
          <ModalSecondaryButton onClick={() => setGranted(baseline)} disabled={!changed}>
            Reset to Role Defaults
          </ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleSave} disabled={!changed}>
            Save Permissions
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3 text-[11px]">
          <span className="text-zinc-500">
            <span className="font-bold text-zinc-800">{granted.length}</span> of{' '}
            {CAPABILITY_GROUPS.reduce((sum, group) => sum + group.capabilities.length, 0)} capabilities granted
          </span>
          {changed && (
            <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold">
              Unsaved changes
            </span>
          )}
        </div>

        {CAPABILITY_GROUPS.map((group) => (
          <div key={group.group}>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 mb-2">{group.group}</h3>
            <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
              {group.capabilities.map((cap) => {
                const locked = isLocked(cap);
                return (
                  <label
                    key={cap.key}
                    className={`flex items-start justify-between gap-4 px-3.5 py-3 transition-colors ${
                      locked ? 'cursor-not-allowed bg-zinc-50/60' : 'cursor-pointer hover:bg-zinc-50/60'
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900">{cap.label}</span>
                        {locked && (
                          <span className="px-1.5 py-0.5 rounded bg-zinc-200 text-zinc-600 text-[10px] font-bold uppercase">
                            Required
                          </span>
                        )}
                      </span>
                      <span className="block text-[11px] text-zinc-500 mt-0.5">{cap.description}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={granted.includes(cap.key)}
                      disabled={locked}
                      onChange={() => toggle(cap)}
                      className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0 disabled:opacity-50"
                    />
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </ModalShell>
  );
}
