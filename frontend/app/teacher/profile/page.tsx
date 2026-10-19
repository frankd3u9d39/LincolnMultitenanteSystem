'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';
import { useAuth } from '@/lib/auth';

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [name, setName] = useState(user?.name ?? 'Faculty Member');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  React.useEffect(() => {
    if (user?.name) {
      setName(user.name);
    }
  }, [user]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEditOpen(false);
    setToastMessage('Faculty profile updated successfully.');
    setTimeout(() => setToastMessage(''), 4000);
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
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Faculty Profile</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage your academic credentials, contact details, and department affiliation.</p>
        </div>
        <button
          onClick={() => setIsEditOpen(true)}
          className="flex items-center justify-center gap-2 bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-800 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm"
        >
          <NavIcon name="cog" className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-[#B81D22] via-[#9E1519] to-[#801217]" />
        
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-2xl border-4 border-white bg-zinc-100 flex items-center justify-center text-[#B81D22] shadow-md font-black text-2xl">
              {name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Faculty
            </span>
          </div>

          <h2 className="text-2xl font-black text-zinc-900">{name}</h2>
          <p className="text-zinc-500 font-semibold text-xs mt-0.5">{department}</p>
          <p className="text-zinc-600 text-xs mt-3 leading-relaxed max-w-2xl">{bio}</p>

          <div className="mt-8 pt-6 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Contact Details</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-[#B81D22]">
                    <NavIcon name="bell" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Institutional Email</div>
                    <div className="text-xs font-bold text-zinc-900">{user?.email ?? 'Not available'}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-600">
                    <NavIcon name="calendar" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Direct Phone</div>
                    <div className="text-xs font-bold text-zinc-900">{phone}</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Academic Credentials</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                    <NavIcon name="building" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Department Assignment</div>
                    <div className="text-xs font-bold text-zinc-900">{department}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <NavIcon name="clipboard" className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-zinc-400 uppercase">Tenure Standing</div>
                    <div className="text-xs font-bold text-zinc-900">Appointed Faculty Member &bull; {user?.schoolName ?? 'Active Faculty'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Faculty Profile"
        maxWidth="md"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Professional Bio</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs focus:outline-none focus:border-[#B81D22] resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519]"
            >
              Save Profile
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
