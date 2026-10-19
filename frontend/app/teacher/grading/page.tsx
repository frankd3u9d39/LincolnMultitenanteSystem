'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

interface GradeRecord {
  id: number;
  name: string;
  idNumber: string;
  class: string;
  assignment: string;
  grade: string;
  score: number | null;
  status: string;
  feedback?: string;
}

export default function GradingPage() {
  const [students, setStudents] = useState<GradeRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<GradeRecord | null>(null);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Modal form states
  const [inputScore, setInputScore] = useState<number | ''>('');
  const [inputGrade, setInputGrade] = useState('');
  const [inputFeedback, setInputFeedback] = useState('');

  const gradedList = students.filter((s) => s.score !== null);
  const avgScore = gradedList.length > 0 ? Math.round(gradedList.reduce((acc, curr) => acc + (curr.score ?? 0), 0) / gradedList.length) : 0;
  const pendingCount = students.filter((s) => s.status === 'Pending').length;
  const progressPct = students.length > 0 ? Math.round((gradedList.length / students.length) * 100) : 0;

  const handleEditGrade = (student: GradeRecord) => {
    setSelectedStudent(student);
    setInputScore(student.score !== null ? student.score : '');
    setInputGrade(student.grade !== '-' ? student.grade : 'B');
    setInputFeedback(student.feedback || '');
    setIsModalOpen(true);
  };

  const handleScoreChange = (val: number) => {
    setInputScore(val);
    if (val >= 90) setInputGrade('A');
    else if (val >= 80) setInputGrade('B');
    else if (val >= 70) setInputGrade('C');
    else if (val >= 60) setInputGrade('D');
    else setInputGrade('F');
  };

  const handleSaveGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || inputScore === '') return;

    setStudents((prev) =>
      prev.map((s) =>
        s.id === selectedStudent.id
          ? {
              ...s,
              score: Number(inputScore),
              grade: inputGrade || 'B',
              status: 'Graded',
              feedback: inputFeedback,
            }
          : s
      )
    );

    setIsModalOpen(false);
    setToastMessage(`Grade successfully recorded for ${selectedStudent.name}.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['Student Name,ID Number,Class,Assignment,Score,Letter Grade,Status,Feedback']
        .concat(
          students.map(
            (s) =>
              `"${s.name}","${s.idNumber}","${s.class}","${s.assignment}",${s.score ?? 'N/A'},"${s.grade}","${s.status}","${s.feedback ?? ''}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Grading_Roster_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredStudents = students.filter((s) => {
    const matchClass = classFilter === 'all' || s.class.toLowerCase() === classFilter.toLowerCase();
    const matchStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.idNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.assignment.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>&check;</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Grading & Evaluation</h1>
          <p className="text-zinc-500 font-medium mt-1">Review student submissions and input official coursework scores.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm"
        >
          <NavIcon name="download" className="w-5 h-5" />
          Export to CSV
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Average Class Score</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">{avgScore}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <NavIcon name="chart" className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Pending Grades</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <NavIcon name="clock" className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-sm border border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100">Grading Progress</p>
            <p className="text-2xl font-bold mt-1">{progressPct}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <NavIcon name="checkCircle" className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:border-[#B81D22] bg-white"
            >
              <option value="all">All Classes</option>
              <option value="mth301">MTH301</option>
              <option value="phy201">PHY201</option>
              <option value="mth101">MTH101</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:border-[#B81D22] bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="graded">Graded</option>
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <NavIcon name="search" className="w-4 h-4 text-zinc-400" />
            </div>
            <input
              type="text"
              placeholder="Search student or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:border-[#B81D22]"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-white text-zinc-500 text-xs uppercase tracking-wider font-semibold border-b border-zinc-100">
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Assignment & Class</th>
                <th className="px-6 py-4">Score</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-zinc-400 text-sm">
                    No submissions found matching criteria.
                  </td>
                </tr>
              )}
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-xs font-bold text-zinc-600">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-900">{student.name}</div>
                        <div className="text-xs text-zinc-500">{student.idNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-zinc-800">{student.assignment}</div>
                    <div className="text-xs font-semibold text-zinc-500 mt-0.5">{student.class}</div>
                  </td>
                  <td className="px-6 py-4">
                    {student.score !== null ? (
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-zinc-900">{student.score}</span>
                        <span className="text-xs font-bold text-zinc-400">/ 100</span>
                        <span
                          className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            student.grade.includes('A')
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.grade.includes('B')
                              ? 'bg-blue-100 text-blue-800'
                              : student.grade.includes('C')
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-zinc-100 text-zinc-800'
                          }`}
                        >
                          {student.grade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-zinc-400">Not Graded</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                        student.status === 'Graded'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          student.status === 'Graded' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`}
                      />
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleEditGrade(student)}
                      className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors ${
                        student.status === 'Graded'
                          ? 'text-zinc-600 hover:bg-zinc-100 border border-zinc-200'
                          : 'bg-[#B81D22] text-white hover:bg-[#9E1519]'
                      }`}
                    >
                      {student.status === 'Graded' ? 'Edit Grade' : 'Grade Now'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grade Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? `Grade ${selectedStudent.assignment}` : 'Grade Student'}
        maxWidth="md"
      >
        {selectedStudent && (
          <form className="space-y-5" onSubmit={handleSaveGrade}>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Student</p>
                <p className="font-bold text-zinc-900">{selectedStudent.name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1">Class</p>
                <p className="font-bold text-zinc-900">{selectedStudent.class}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1.5">Score (out of 100) *</label>
                <input
                  type="number"
                  value={inputScore}
                  onChange={(e) => handleScoreChange(Number(e.target.value))}
                  placeholder="e.g. 85"
                  max={100}
                  min={0}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#B81D22] transition-colors text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1.5">Letter Grade</label>
                <select
                  value={inputGrade}
                  onChange={(e) => setInputGrade(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#B81D22] transition-colors bg-white font-bold"
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B">B</option>
                  <option value="B-">B-</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-zinc-900 mb-1.5">Feedback / Comments (Optional)</label>
              <textarea
                rows={3}
                value={inputFeedback}
                onChange={(e) => setInputFeedback(e.target.value)}
                placeholder="Great job on section 2; review calculus theorem on question 4..."
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:border-[#B81D22] transition-colors resize-none text-sm"
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
                className="px-5 py-2.5 rounded-lg font-bold bg-[#B81D22] hover:bg-[#9E1519] text-white shadow-md transition-colors"
              >
                Save Grade
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
