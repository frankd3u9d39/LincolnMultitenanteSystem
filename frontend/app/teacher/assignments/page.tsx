'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';
import { useAsync } from '@/modules/superadmin/hooks/useAsync';
import { ErrorBlock, LoadingBlock } from '@/modules/superadmin/components/LoadState';
import { createAssignment, listAssignments, listClasses } from '@/modules/teacher/services/api';
import { ApiError } from '@/services/api';

export default function AssignmentsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalMarks, setTotalMarks] = useState('100');
  const [instructions, setInstructions] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: assignments, loading, error, reload } = useAsync((signal) => listAssignments(signal), []);
  const { data: classes } = useAsync((signal) => listClasses(signal), []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSaving(true);
    try {
      await createAssignment({
        title,
        school_class_id: Number(classId),
        due_date: dueDate,
        total_marks: Number(totalMarks),
        instructions: instructions || undefined,
      });
      setTitle('');
      setClassId('');
      setDueDate('');
      setTotalMarks('100');
      setInstructions('');
      setIsModalOpen(false);
      reload();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not create this assignment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Assignments</h1>
          <p className="text-zinc-500 font-medium mt-1">Manage and grade student assignments.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#B81D22] hover:bg-[#9E1519] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md"
        >
          <NavIcon name="clipboard" className="w-5 h-5" />
          Create Assignment
        </button>
      </div>

      {loading ? (
        <LoadingBlock rows={5} label="Loading assignments" />
      ) : error || !assignments ? (
        <ErrorBlock message={error ?? 'No data available.'} onRetry={reload} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider font-semibold">
                  <th className="px-6 py-4">Title & Class</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Submissions</th>
                  <th className="px-6 py-4">Total Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {assignments.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-400">No assignments yet.</td></tr>
                )}
                {assignments.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-zinc-900">{item.title}</div>
                      <div className="text-sm text-zinc-500 mt-1">{item.school_class?.name ?? '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                      {new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                        {item.teacher_submissions_count ?? 0} submitted
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-700">{item.total_marks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Assignment"
        maxWidth="lg"
      >
        <form className="space-y-5" onSubmit={handleCreate}>
          {formError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-semibold text-red-800">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Assignment Title</label>
            <input
              required
              type="text"
              placeholder="e.g. Chapter 4 Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Select Class</label>
            <select
              required
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors appearance-none bg-white"
            >
              <option value="" disabled>Choose a class...</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-1.5">Due Date</label>
              <input
                required
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-1.5">Total Marks</label>
              <input
                required
                type="number"
                min={1}
                placeholder="100"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-900 mb-1.5">Instructions</label>
            <textarea
              rows={4}
              placeholder="Provide guidelines for the students..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
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
              {saving ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
