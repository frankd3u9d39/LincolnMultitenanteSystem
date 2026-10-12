'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

export default function GradingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  const students = [
    { id: 1, name: 'Alice Johnson', idNumber: 'STD-001', class: 'MTH301', assignment: 'Calculus Midterm', grade: 'A', score: 92, status: 'Graded' },
    { id: 2, name: 'Michael Smith', idNumber: 'STD-002', class: 'PHY201', assignment: 'Lab Report 4', grade: 'B+', score: 87, status: 'Graded' },
    { id: 3, name: 'Emma Davis', idNumber: 'STD-003', class: 'MTH101', assignment: 'Worksheet 7', grade: 'A-', score: 90, status: 'Graded' },
    { id: 4, name: 'James Wilson', idNumber: 'STD-004', class: 'MTH301', assignment: 'Calculus Midterm', grade: 'C', score: 75, status: 'Graded' },
    { id: 5, name: 'Sophia Brown', idNumber: 'STD-005', class: 'PHY201', assignment: 'Lab Report 4', grade: '-', score: null, status: 'Pending' },
    { id: 6, name: 'Lucas Martinez', idNumber: 'STD-006', class: 'MTH301', assignment: 'Calculus Midterm', grade: '-', score: null, status: 'Pending' },
  ];

  const handleEditGrade = (student: any) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Grading & Evaluation</h1>
          <p className="text-zinc-500 font-medium mt-1">Review submissions and input grades.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-800 px-5 py-2.5 rounded-lg font-semibold transition-all shadow-sm">
          <NavIcon name="download" className="w-5 h-5" />
          Export to CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Average Class Score</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">86%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <NavIcon name="chart" className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-500">Pending Grades</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1">24</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <NavIcon name="clock" className="w-6 h-6" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-sm border border-emerald-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100">Grading Progress</p>
            <p className="text-2xl font-bold mt-1">82%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <NavIcon name="checkCircle" className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select defaultValue="" className="w-full sm:w-48 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] bg-white">
              <option value="" disabled>Filter by Class</option>
              <option value="all">All Classes</option>
              <option value="mth301">MTH301</option>
              <option value="phy201">PHY201</option>
            </select>
            <select defaultValue="" className="w-full sm:w-48 px-3 py-2 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] bg-white">
              <option value="" disabled>Filter by Status</option>
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
              placeholder="Search student..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
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
              {students.map((student) => (
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
                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          student.grade.includes('A') ? 'bg-emerald-100 text-emerald-800' :
                          student.grade.includes('B') ? 'bg-blue-100 text-blue-800' :
                          student.grade.includes('C') ? 'bg-amber-100 text-amber-800' :
                          'bg-zinc-100 text-zinc-800'
                        }`}>
                          {student.grade}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-zinc-400">Not Graded</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      student.status === 'Graded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${student.status === 'Graded' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={selectedStudent ? `Grade ${selectedStudent.assignment}` : 'Grade Student'}
        maxWidth="md"
      >
        {selectedStudent && (
          <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); setIsModalOpen(false); }}>
            
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
                <label className="block text-sm font-bold text-zinc-900 mb-1.5">Score (out of 100)</label>
                <input 
                  type="number" 
                  defaultValue={selectedStudent.score || ''}
                  placeholder="e.g. 85" 
                  max="100"
                  min="0"
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors text-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-zinc-900 mb-1.5">Letter Grade</label>
                <select 
                  defaultValue={selectedStudent.grade !== '-' ? selectedStudent.grade : ''}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#B81D22]/20 focus:border-[#B81D22] transition-colors appearance-none bg-white font-bold"
                >
                  <option value="" disabled>Select...</option>
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
                placeholder="Great job on the final section, but check your math on question 4..."
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
