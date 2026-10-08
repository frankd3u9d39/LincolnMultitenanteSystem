'use client';

import React, { useState } from 'react';
import { SchoolTenant } from '../types';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';
import { storageUsagePercent } from '../utils';

interface StorageQuotaModalProps {
  tenant: SchoolTenant;
  onClose: () => void;
  onApply: (storageQuotaGb: number) => void;
}

const PRESET_QUOTAS = [50, 250, 500, 1000, 2000];

/** Raises or lowers a single tenant's storage ceiling. */
export function StorageQuotaModal({ tenant, onClose, onApply }: StorageQuotaModalProps) {
  const [quota, setQuota] = useState(tenant.storageQuotaGb);
  const [error, setError] = useState('');

  const changed = quota !== tenant.storageQuotaGb;
  const belowUsage = quota < tenant.storageUsedGb;
  const projectedUsage = quota === 0 ? 0 : Math.min(100, (tenant.storageUsedGb / quota) * 100);

  const handleApply = () => {
    if (quota < 1) {
      setError('Allocate at least 1 GB.');
      return;
    }
    if (belowUsage) {
      setError(`Below the ${tenant.storageUsedGb.toFixed(1)} GB already stored by this school.`);
      return;
    }
    onApply(quota);
    onClose();
  };

  return (
    <ModalShell
      eyebrow="Resource Limits"
      title="Adjust Storage Quota"
      subtitle={`${tenant.name} • ${tenant.code}`}
      onClose={onClose}
      footer={
        <>
          <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
          <ModalPrimaryButton onClick={handleApply} disabled={!changed || belowUsage}>
            Apply Quota
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-200 p-3.5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-zinc-500">Currently stored</span>
            <span className="font-bold text-zinc-900">
              {tenant.storageUsedGb.toFixed(1)} GB of {tenant.storageQuotaGb} GB
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-zinc-100 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                storageUsagePercent(tenant) > 85
                  ? 'bg-red-500'
                  : storageUsagePercent(tenant) > 60
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${storageUsagePercent(tenant)}%` }}
            />
          </div>
        </div>

        <div>
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5"
            htmlFor="tenant-quota"
          >
            New Quota (GB)
          </label>
          <input
            id="tenant-quota"
            type="text"
            inputMode="numeric"
            value={quota.toLocaleString()}
            onChange={(e) => {
              setQuota(Number(e.target.value.replace(/[^0-9]/g, '')) || 0);
              setError('');
            }}
            className={`w-full px-3 py-2 text-xs rounded-xl border bg-white text-zinc-800 focus:outline-none focus:ring-2 transition-all ${
              error
                ? 'border-red-400 focus:ring-red-500/20 focus:border-red-500'
                : 'border-zinc-200 focus:ring-[#B81D22]/20 focus:border-[#B81D22]'
            }`}
          />
          {error && <p className="mt-1 text-[11px] font-semibold text-red-600">{error}</p>}

          <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
            {PRESET_QUOTAS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  setQuota(preset);
                  setError('');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                  quota === preset
                    ? 'border-[#B81D22] bg-red-50 text-[#B81D22]'
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                {preset >= 1000 ? `${preset / 1000} TB` : `${preset} GB`}
              </button>
            ))}
          </div>
        </div>

        {changed && !belowUsage && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-[11px] text-blue-900 leading-relaxed">
            <p className="font-bold uppercase tracking-wider">After this change</p>
            <p className="mt-1">
              {tenant.name} would be at {projectedUsage.toFixed(1)}% of its {quota.toLocaleString()} GB allocation.
              The new ceiling applies to uploads immediately.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
