'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

// Mock Data
const FEE_SUMMARY = {
  totalDue: 2450.00,
  dueDate: '2026-11-01',
  totalPaid: 8500.00,
  term: 'Fall 2026',
};

const FEE_BREAKDOWN = [
  { id: 1, description: 'Tuition Fee (Fall 2026)', amount: 4500.00, status: 'Partial', paid: 2500.00, due: 2000.00 },
  { id: 2, description: 'Lab Equipment Fee', amount: 350.00, status: 'Unpaid', paid: 0.00, due: 350.00 },
  { id: 3, description: 'Library & Technology Fee', amount: 100.00, status: 'Unpaid', paid: 0.00, due: 100.00 },
  { id: 4, description: 'Student Union Fee', amount: 50.00, status: 'Paid', paid: 50.00, due: 0.00 },
];

const PAYMENT_HISTORY = [
  { id: 101, date: 'Sep 15, 2026', method: 'Credit Card (ends in 4242)', amount: 2500.00, receipt: '#REC-89234' },
  { id: 102, date: 'Sep 01, 2026', method: 'Bank Transfer', amount: 50.00, receipt: '#REC-89102' },
  { id: 103, date: 'Jan 10, 2026', method: 'Credit Card (ends in 4242)', amount: 6000.00, receipt: '#REC-77341' },
];

export default function StudentFeesPage() {
  const router = useRouter();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Fee Status
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage your tuition, view payment history, and pay outstanding balances.
          </p>
        </div>
        <button 
          onClick={() => window.location.href = '/student/fees/pay'}
          className="px-5 py-2.5 bg-[#B81D22] text-white text-sm font-bold rounded-xl hover:bg-[#9E1519] transition-colors shadow-md shadow-red-900/10 flex items-center gap-2 w-max"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          Pay Balance
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Outstanding Balance Card - Highlighted */}
        <div className="bg-zinc-900 text-white border border-zinc-800 rounded-2xl p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="relative z-10">
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1">Total Outstanding Due</p>
            <h3 className="text-4xl font-black tracking-tight mb-2">${FEE_SUMMARY.totalDue.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            <p className="text-sm font-medium text-[#B81D22] bg-white/10 w-max px-3 py-1 rounded-lg backdrop-blur-sm">
              Due by: {new Date(FEE_SUMMARY.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric'})}
            </p>
          </div>
        </div>

        {/* Other KPIs */}
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Total Paid This Year</p>
          <h3 className="text-3xl font-black text-emerald-600 tracking-tight">${FEE_SUMMARY.totalPaid.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
        </div>
        
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-1">Current Term</p>
          <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{FEE_SUMMARY.term}</h3>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fee Breakdown */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 px-1">Outstanding Fees Breakdown</h2>
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100">
              {FEE_BREAKDOWN.map(fee => (
                <div key={fee.id} className="p-4 sm:p-5 hover:bg-zinc-50 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900">{fee.description}</h3>
                      <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded border ${
                        fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        fee.status === 'Partial' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {fee.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-zinc-900">${fee.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                      {fee.due > 0 && (
                        <p className="text-xs font-bold text-[#B81D22] mt-0.5">${fee.due.toLocaleString('en-US', {minimumFractionDigits: 2})} due</p>
                      )}
                    </div>
                  </div>
                  
                  {fee.status === 'Partial' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] font-bold text-zinc-500 mb-1 uppercase tracking-wider">
                        <span>Paid: ${fee.paid.toLocaleString()}</span>
                        <span>{Math.round((fee.paid / fee.amount) * 100)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(fee.paid / fee.amount) * 100}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-zinc-900 px-1">Recent Payments</h2>
          <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-100">
              {PAYMENT_HISTORY.map(payment => (
                <div key={payment.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                  <div className="flex flex-col gap-1">
                    <p className="text-sm font-bold text-zinc-900">${payment.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</p>
                    <p className="text-xs text-zinc-500">{payment.method}</p>
                    <p className="text-[10px] text-zinc-400 font-mono">{payment.receipt}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <span className="text-xs font-medium text-zinc-500">{payment.date}</span>
                    <button className="text-[11px] font-bold text-[#B81D22] hover:text-[#9E1519] bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                      Receipt
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full py-3 text-xs font-bold text-zinc-600 hover:text-[#B81D22] bg-zinc-50 border-t border-zinc-200 transition-colors">
              View All Payments
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
