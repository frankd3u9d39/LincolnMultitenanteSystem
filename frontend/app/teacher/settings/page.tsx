'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

export default function SettingsPage() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setToastMessage('Account password updated successfully.');
    setTimeout(() => setToastMessage(''), 4000);
  };

  const toggleEmail = () => {
    const next = !emailNotifs;
    setEmailNotifs(next);
    setToastMessage(`Email digests ${next ? 'enabled' : 'disabled'}.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const togglePush = () => {
    const next = !pushNotifs;
    setPushNotifs(next);
    setToastMessage(`Push notifications ${next ? 'enabled' : 'disabled'}.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const toggle2FA = () => {
    const next = !twoFactor;
    setTwoFactor(next);
    setToastMessage(`Two-Factor Authentication ${next ? 'activated' : 'deactivated'}.`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>&check;</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Faculty Settings</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage notification channels, security, and classroom preferences.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 divide-y divide-zinc-100">
        <div className="p-6 md:p-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <NavIcon name="bell" className="w-5 h-5 text-zinc-400" />
            Notification Channels
          </h2>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-800 text-sm">Email Notifications & Digest</p>
                <p className="text-xs text-zinc-500 mt-0.5">Receive daily summaries of student submissions and department announcements.</p>
              </div>
              <button
                type="button"
                onClick={toggleEmail}
                className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${
                  emailNotifs ? 'bg-[#B81D22]' : 'bg-zinc-200'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    emailNotifs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-zinc-800 text-sm">Instant Push Notifications</p>
                <p className="text-xs text-zinc-500 mt-0.5">Receive immediate alerts when students submit assignments late or message you.</p>
              </div>
              <button
                type="button"
                onClick={togglePush}
                className={`w-11 h-6 rounded-full flex items-center p-1 transition-colors ${
                  pushNotifs ? 'bg-[#B81D22]' : 'bg-zinc-200'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    pushNotifs ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
            <NavIcon name="shield" className="w-5 h-5 text-zinc-400" />
            Security & Authentication
          </h2>
          <div className="space-y-4">
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="text-xs font-bold text-[#B81D22] hover:text-[#9E1519] border border-zinc-200 rounded-xl px-4 py-2 hover:bg-zinc-50 transition-colors shadow-sm"
            >
              Change Account Password
            </button>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-100">
              <div>
                <p className="font-bold text-zinc-800 text-sm">Two-Factor Authentication (2FA)</p>
                <p className="text-xs text-zinc-500 mt-0.5">Secure faculty grading and attendance records with an authenticator app.</p>
              </div>
              <button
                type="button"
                onClick={toggle2FA}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors ${
                  twoFactor
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {twoFactor ? 'Enabled &bull; Active' : 'Enable 2FA'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Change Faculty Password"
        maxWidth="md"
      >
        <form onSubmit={handlePasswordChange} className="space-y-4">
          {passwordError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
              {passwordError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Current Password *</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">New Password (Min 8 chars) *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519]"
            >
              Update Password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
