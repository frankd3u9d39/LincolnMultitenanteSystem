'use client';

import React, { useState } from 'react';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createAnnouncement, listAnnouncements } from '@/modules/admin/services/api';
import { ApiError } from '@/services/api';

export default function AdminAnnouncementsPage() {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState('all');
  const [important, setImportant] = useState(false);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data, loading, error, reload } = useAsync((signal) => listAnnouncements(signal), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createAnnouncement({ title, content, audience, important });
      setTitle('');
      setContent('');
      setImportant(false);
      setShowForm(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not post this announcement.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Announcements</h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">Post school-wide or audience-targeted notices.</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519] transition-all shadow-md shadow-red-900/10 w-max"
        >
          {showForm ? 'Cancel' : '+ New Announcement'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm space-y-3 max-w-2xl">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>}
          <input required placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
          <textarea required placeholder="Message" value={content} onChange={(e) => setContent(e.target.value)} rows={4} className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
          <div className="flex items-center gap-4">
            <input placeholder="Audience (e.g. all, staff, grade-10)" value={audience} onChange={(e) => setAudience(e.target.value)} className="flex-1 px-3.5 py-2.5 text-sm rounded-xl border border-zinc-200" />
            <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
              <input type="checkbox" checked={important} onChange={(e) => setImportant(e.target.checked)} />
              Mark important
            </label>
          </div>
          <button disabled={saving} className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold disabled:opacity-60">
            {saving ? 'Posting…' : 'Post Announcement'}
          </button>
        </form>
      )}

      {loading ? (
        <LoadingBlock rows={5} label="Loading announcements" />
      ) : error || !data ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="space-y-3">
          {data.length === 0 && <p className="text-zinc-400 text-sm">No announcements yet.</p>}
          {data.map((a) => (
            <div key={a.id} className={`bg-white border rounded-2xl p-5 shadow-sm ${a.important ? 'border-red-200' : 'border-zinc-200'}`}>
              <div className="flex items-start justify-between gap-3 mb-1">
                <h3 className="text-base font-bold text-zinc-900">{a.title}</h3>
                {a.important && <span className="text-[10px] font-black uppercase text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-md">Important</span>}
              </div>
              <p className="text-sm text-zinc-600 mb-3">{a.content}</p>
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>To: {a.audience} &middot; By {a.postedBy ?? 'Unknown'}</span>
                <span>{new Date(a.date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
