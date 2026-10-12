'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createAnnouncement, listAnnouncements, listClasses } from '@/modules/teacher/services/api';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/services/api';

export default function AnnouncementsPage() {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState('all');
  const [important, setImportant] = useState(false);
  const [content, setContent] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: announcements, loading, error, reload } = useAsync((signal) => listAnnouncements(signal), []);
  const { data: classes } = useAsync((signal) => listClasses(signal), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createAnnouncement({ title, content, target_audience: audience, is_important: important });
      setTitle('');
      setAudience('all');
      setImportant(false);
      setContent('');
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not post this notice.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Announcements</h1>
          <p className="text-zinc-500 font-medium mt-1">Stay updated with the latest school news and notices.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#B81D22] hover:bg-[#9E1519] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md"
        >
          <NavIcon name="bell" className="w-5 h-5" />
          Create Notice
        </button>
      </div>

      {loading ? (
        <LoadingBlock rows={4} label="Loading announcements" />
      ) : error || !announcements ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="grid gap-4">
          {announcements.length === 0 && <p className="text-sm text-zinc-400">No announcements posted yet.</p>}
          {announcements.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow relative overflow-hidden">
              {item.is_important && <div className="absolute top-0 right-0 w-2 h-full bg-red-500" />}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                    {item.title}
                    {item.is_important && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Important</span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500 font-medium">
                    <span className="flex items-center gap-1.5">
                      <NavIcon name="calendar" className="w-4 h-4" />
                      {new Date(item.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <NavIcon name="user" className="w-4 h-4" />
                      {user?.name ?? 'You'}
                    </span>
                    <span className="flex items-center gap-1.5">To: {item.target_audience}</span>
                  </div>
                  <p className="mt-4 text-zinc-700 leading-relaxed">{item.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Notice"
        maxWidth="lg"
      >
        <form className="space-y-5" onSubmit={handleCreate}>
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Notice Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Schedule Change for Next Week"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors appearance-none bg-white"
            >
              <option value="all">All My Students</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.code}>{c.name} ({c.code}) Only</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 cursor-pointer hover:bg-zinc-50 transition-colors">
            <input
              type="checkbox"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
              className="w-4 h-4 text-[#B81D22] rounded border-zinc-300 focus:ring-[#B81D22]"
            />
            <span className="text-sm font-bold text-zinc-900">Mark as Important</span>
          </label>

          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Message Content</label>
            <textarea
              required
              rows={5}
              placeholder="Type your announcement here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors resize-none"
            />
          </div>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-5 py-2.5 rounded-lg font-bold text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg font-bold bg-[#B81D22] hover:bg-[#9E1519] text-white shadow-md transition-colors disabled:opacity-60"
            >
              {saving ? 'Posting…' : 'Post Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
