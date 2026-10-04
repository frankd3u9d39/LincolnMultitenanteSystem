'use client';

import React, { useState } from 'react';
import { SchoolTenant, SubscriptionTier } from '../types';
import { ModalPrimaryButton, ModalSecondaryButton, ModalShell } from './ModalShell';
import {
  INVOICE_STATUS_STYLES,
  TIER_PRESETS,
  TIER_STYLES,
  billingHistoryFor,
  downloadCsv,
} from '../utils';

interface ChangeTierModalProps {
  tenant: SchoolTenant;
  onClose: () => void;
  onApply: (tier: SubscriptionTier) => void;
}

/** Moves a tenant between subscription tiers, showing the quota and billing impact first. */
export function ChangeTierModal({ tenant, onClose, onApply }: ChangeTierModalProps) {
  const [tier, setTier] = useState<SubscriptionTier>(tenant.tier);
  const preset = TIER_PRESETS[tier];
  const changed = tier !== tenant.tier;
  const feeDelta = preset.monthlyFeeNgn - tenant.monthlyFeeNgn;
  const overCapacity = tenant.students > preset.maxStudents || tenant.storageUsedGb > preset.storageQuotaGb;

  return (
    <ModalShell
      eyebrow="Subscription"
      title="Change Tier"
      subtitle={tenant.name}
      onClose={onClose}
      footer={
        <>
          <ModalSecondaryButton onClick={onClose}>Cancel</ModalSecondaryButton>
          <ModalPrimaryButton
            disabled={!changed || overCapacity}
            onClick={() => {
              onApply(tier);
              onClose();
            }}
          >
            Apply Tier Change
          </ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2.5">
          {(Object.keys(TIER_PRESETS) as SubscriptionTier[]).map((option) => {
            const optionPreset = TIER_PRESETS[option];
            const tooSmall =
              tenant.students > optionPreset.maxStudents || tenant.storageUsedGb > optionPreset.storageQuotaGb;

            return (
              <label
                key={option}
                className={`flex items-start gap-3 rounded-xl border p-3.5 transition-all ${
                  tooSmall
                    ? 'border-zinc-200 bg-zinc-50/60 cursor-not-allowed opacity-60'
                    : tier === option
                    ? 'border-[#B81D22] bg-red-50/40 ring-2 ring-red-600/10 cursor-pointer'
                    : 'border-zinc-200 hover:bg-zinc-50/60 cursor-pointer'
                }`}
              >
                <input
                  type="radio"
                  name="tenant-tier"
                  value={option}
                  checked={tier === option}
                  disabled={tooSmall}
                  onChange={() => setTier(option)}
                  className="mt-0.5 w-4 h-4 accent-[#B81D22] shrink-0"
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-zinc-900">{optionPreset.label}</span>
                    {option === tenant.tier && (
                      <span className="px-2 py-0.5 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-extrabold uppercase shrink-0">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-zinc-500 mt-0.5">
                    ₦{optionPreset.monthlyFeeNgn.toLocaleString()} / month &bull;{' '}
                    {optionPreset.maxStudents.toLocaleString()} students &bull; {optionPreset.storageQuotaGb} GB
                  </span>
                  {tooSmall && (
                    <span className="block text-[11px] font-semibold text-red-600 mt-1">
                      Below this tenant&apos;s current usage ({tenant.students.toLocaleString()} students,{' '}
                      {tenant.storageUsedGb.toFixed(1)} GB).
                    </span>
                  )}
                </span>
              </label>
            );
          })}
        </div>

        {changed && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-[11px] text-blue-900 leading-relaxed">
            <p className="font-bold uppercase tracking-wider text-[11px]">Billing impact</p>
            <p className="mt-1">
              Monthly charge moves from ₦{tenant.monthlyFeeNgn.toLocaleString()} to ₦
              {preset.monthlyFeeNgn.toLocaleString()} ({feeDelta >= 0 ? '+' : '−'}₦
              {Math.abs(feeDelta).toLocaleString()}). Storage quota becomes {preset.storageQuotaGb} GB and the
              change is prorated from the next invoice on {tenant.renewsOn}.
            </p>
          </div>
        )}
      </div>
    </ModalShell>
  );
}

interface BillingHistoryModalProps {
  tenant: SchoolTenant;
  onClose: () => void;
  onExported: (fileName: string) => void;
}

/** Recent invoices for a tenant, with a working CSV export. */
export function BillingHistoryModal({ tenant, onClose, onExported }: BillingHistoryModalProps) {
  const invoices = billingHistoryFor(tenant);
  const totalPaid = invoices
    .filter((invoice) => invoice.status === 'paid')
    .reduce((sum, invoice) => sum + invoice.amountNgn, 0);
  const totalDue = invoices
    .filter((invoice) => invoice.status === 'due')
    .reduce((sum, invoice) => sum + invoice.amountNgn, 0);

  const handleExport = () => {
    const fileName = downloadCsv(
      `billing_${tenant.code}`,
      ['Reference', 'Issued On', 'Period', 'Amount (NGN)', 'Status', 'Method'],
      invoices.map((invoice) => [
        invoice.reference,
        invoice.issuedOn,
        invoice.periodLabel,
        invoice.amountNgn,
        invoice.status,
        invoice.method,
      ])
    );
    onExported(fileName);
  };

  return (
    <ModalShell
      eyebrow="Billing"
      title="Billing History"
      subtitle={`${tenant.name} • ${tenant.code}`}
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={
        <>
          <ModalSecondaryButton onClick={handleExport}>Export CSV</ModalSecondaryButton>
          <ModalPrimaryButton onClick={onClose}>Done</ModalPrimaryButton>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="rounded-xl border border-zinc-200 p-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Settled</span>
            <div className="mt-1 text-base font-black text-emerald-700">₦{totalPaid.toLocaleString()}</div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Outstanding</span>
            <div className={`mt-1 text-base font-black ${totalDue > 0 ? 'text-red-700' : 'text-zinc-900'}`}>
              ₦{totalDue.toLocaleString()}
            </div>
          </div>
          <div className="rounded-xl border border-zinc-200 p-3">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-zinc-500">Current Tier</span>
            <div className="mt-1.5">
              <span className={`inline-block px-2 py-0.5 rounded-md border font-semibold text-[11px] ${TIER_STYLES[tenant.tier]}`}>
                {tenant.tierLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 border-b border-zinc-200/80 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-2.5 px-3">Reference</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3">Method</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-700">
              {invoices.map((invoice) => (
                <tr key={invoice.reference} className="hover:bg-zinc-50/60 transition-colors">
                  <td className="py-3 px-3 font-mono text-[11px] text-zinc-600">{invoice.reference}</td>
                  <td className="py-3 px-3">
                    <div className="font-semibold text-zinc-900">{invoice.periodLabel}</div>
                    <div className="text-[11px] text-zinc-400 font-mono">Issued {invoice.issuedOn}</div>
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-zinc-900">
                    {invoice.amountNgn === 0 ? '—' : `₦${invoice.amountNgn.toLocaleString()}`}
                  </td>
                  <td className="py-3 px-3 text-zinc-500">{invoice.method}</td>
                  <td className="py-3 px-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-extrabold uppercase tracking-wider ${INVOICE_STATUS_STYLES[invoice.status]}`}>
                      {invoice.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ModalShell>
  );
}
