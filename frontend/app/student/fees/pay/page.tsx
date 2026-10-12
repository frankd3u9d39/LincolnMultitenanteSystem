'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// Mock Outstanding Fees
const OUTSTANDING_FEES = [
  { id: 1, description: 'Tuition Fee (Fall 2026)', due: 2000.00, required: true },
  { id: 2, description: 'Lab Equipment Fee', due: 350.00, required: false },
  { id: 3, description: 'Library & Technology Fee', due: 100.00, required: false },
];

export default function PaymentCheckoutPage() {
  const [selectedFees, setSelectedFees] = useState<number[]>(OUTSTANDING_FEES.map(f => f.id));
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const toggleFee = (id: number) => {
    setSelectedFees(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  const totalAmount = OUTSTANDING_FEES
    .filter(f => selectedFees.includes(f.id))
    .reduce((sum, f) => sum + f.due, 0);

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    // Mock processing delay
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-lg mx-auto">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-zinc-900 tracking-tight mb-2">Payment Successful!</h1>
        <p className="text-sm text-zinc-500 mb-8">
          Thank you. We have received your payment of <strong>${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</strong>. A receipt has been sent to your student email.
        </p>
        <Link href="/student/fees" className="px-6 py-3 bg-zinc-900 text-white text-sm font-bold rounded-xl hover:bg-zinc-800 transition-colors shadow-sm">
          Return to Fee Status
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-2 hover:text-zinc-900 transition-colors w-max">
            <Link href="/student/fees" className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Back to Fees
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Checkout
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Select the fees you wish to pay and securely enter your payment details.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Select Fees */}
        <div className="lg:col-span-7 space-y-6">
          <h2 className="text-lg font-bold text-zinc-900 px-1">Select Fees to Pay</h2>
          
          <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-zinc-100">
            {OUTSTANDING_FEES.map(fee => (
              <label 
                key={fee.id} 
                className={`flex items-center gap-4 p-5 cursor-pointer transition-colors hover:bg-zinc-50/50 ${selectedFees.includes(fee.id) ? 'bg-red-50/20' : ''}`}
              >
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={selectedFees.includes(fee.id)}
                    onChange={() => toggleFee(fee.id)}
                    disabled={fee.required}
                    className={`w-5 h-5 rounded border-zinc-300 text-[#B81D22] focus:ring-[#B81D22] ${fee.required ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900">{fee.description}</p>
                  {fee.required && <p className="text-[10px] uppercase font-bold text-zinc-400 mt-0.5">Required Payment</p>}
                </div>
                <p className="text-sm font-black text-zinc-900">
                  ${fee.due.toLocaleString('en-US', {minimumFractionDigits: 2})}
                </p>
              </label>
            ))}
          </div>
        </div>

        {/* Right Column: Payment Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-6 shadow-sm sticky top-6">
            <h3 className="text-lg font-black text-zinc-900 tracking-tight mb-4 border-b border-zinc-200 pb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-6">
              {OUTSTANDING_FEES.filter(f => selectedFees.includes(f.id)).map(fee => (
                <div key={fee.id} className="flex justify-between text-sm text-zinc-600">
                  <span className="truncate pr-4">{fee.description}</span>
                  <span className="font-bold text-zinc-900 shrink-0">${fee.due.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-end border-t border-zinc-200 pt-4 mb-6">
              <span className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Total Due</span>
              <span className="text-3xl font-black text-[#B81D22] tracking-tight">
                ${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}
              </span>
            </div>

            {/* Payment Details Form */}
            <form onSubmit={handlePayment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Cardholder Name</label>
                <input required type="text" placeholder="e.g. Liam Chen" className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
              </div>
              
              <div>
                <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Card Number</label>
                <div className="relative">
                  <input required type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
                  <svg className="absolute right-3 top-2.5 w-6 h-6 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Expiry</label>
                  <input required type="text" placeholder="MM/YY" className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">CVC</label>
                  <input required type="text" placeholder="123" className="w-full px-3 py-2.5 text-sm rounded-xl border border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-all" />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isProcessing || totalAmount === 0}
                className={`w-full flex items-center justify-center gap-2 py-3.5 mt-4 rounded-xl text-sm font-black transition-all shadow-md ${
                  totalAmount === 0 
                    ? 'bg-zinc-200 text-zinc-400 cursor-not-allowed'
                    : 'bg-[#B81D22] text-white hover:bg-[#9E1519] shadow-red-900/10'
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Processing...
                  </>
                ) : (
                  `Pay $${totalAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}`
                )}
              </button>

              <p className="text-center text-[10px] font-medium text-zinc-400 mt-3 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Payments are securely processed via Stripe
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
