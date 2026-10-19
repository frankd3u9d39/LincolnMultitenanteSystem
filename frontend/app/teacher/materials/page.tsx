'use client';

import React, { useState } from 'react';
import { NavIcon } from '@/components/navigation/NavIcons';
import { Modal } from '@/components/modals/Modal';

interface MaterialItem {
  id: number;
  title: string;
  type: string;
  size: string;
  class: string;
  uploadDate: string;
  downloadsCount: number;
}

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [toastMessage, setToastMessage] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [className, setClassName] = useState('MTH301');
  const [fileType, setFileType] = useState('PDF');
  const [fileSize, setFileSize] = useState('2.5 MB');

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newMaterial: MaterialItem = {
      id: Date.now(),
      title: title.trim(),
      type: fileType,
      size: fileSize,
      class: className,
      uploadDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      downloadsCount: 0,
    };

    setMaterials([newMaterial, ...materials]);
    setIsUploadOpen(false);
    setTitle('');
    setToastMessage(`"${newMaterial.title}" uploaded to ${newMaterial.class}.`);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleDownload = (item: MaterialItem) => {
    setMaterials(prev => prev.map(m => m.id === item.id ? { ...m, downloadsCount: m.downloadsCount + 1 } : m));
    const element = document.createElement('a');
    const file = new Blob([`Lincoln School Subject Learning Material: ${item.title}\nClass: ${item.class}\nDate: ${item.uploadDate}`], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${item.title.replace(/[^a-zA-Z0-9]/g, '_')}.${item.type.toLowerCase()}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDelete = (id: number, itemTitle: string) => {
    if (confirm(`Are you sure you want to remove "${itemTitle}"?`)) {
      setMaterials(prev => prev.filter(m => m.id !== id));
      setToastMessage(`Material "${itemTitle}" deleted.`);
      setTimeout(() => setToastMessage(''), 4000);
    }
  };

  const filtered = materials.filter(m => {
    const matchClass = classFilter === 'all' || m.class.toLowerCase() === classFilter.toLowerCase();
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) || m.class.toLowerCase().includes(search.toLowerCase());
    return matchClass && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-bounce">
          <span>&check;</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">Subject Learning Materials</h1>
          <p className="text-zinc-500 font-medium mt-1">Upload and manage lesson notes, worksheets, and syllabus reading materials for your students.</p>
        </div>
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#B81D22] hover:bg-[#9E1519] text-white px-5 py-2.5 rounded-lg font-semibold transition-all shadow-md w-max"
        >
          <NavIcon name="book" className="w-5 h-5" />
          Upload Material
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <NavIcon name="search" className="w-4 h-4 text-zinc-400" />
          </div>
          <input
            type="text"
            placeholder="Search material title or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-700 focus:outline-none focus:border-[#B81D22] bg-white"
          >
            <option value="all">All Classes</option>
            <option value="MTH301">MTH301</option>
            <option value="PHY201">PHY201</option>
            <option value="MTH101">MTH101</option>
          </select>
        </div>
      </div>

      {/* Materials Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 && (
          <div className="col-span-full py-12 text-center text-zinc-400 text-sm">
            No study materials found matching your criteria.
          </div>
        )}
        {filtered.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100 hover:shadow-md transition-shadow flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 text-[#B81D22] flex items-center justify-center shrink-0 border border-red-100 font-bold text-xs">
                  {item.type}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-zinc-900 text-sm line-clamp-2 leading-snug">{item.title}</h3>
                  <p className="text-xs font-bold text-[#B81D22] mt-1">{item.class}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs font-medium text-zinc-400">
                    <span className="bg-zinc-100 px-2 py-0.5 rounded text-[10px] text-zinc-600 font-bold">{item.type}</span>
                    <span>&bull;</span>
                    <span>{item.size}</span>
                    <span>&bull;</span>
                    <span>{item.downloadsCount} downloads</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-zinc-100 flex items-center justify-between">
              <span className="text-[11px] font-medium text-zinc-400">Uploaded {item.uploadDate}</span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleDownload(item)}
                  title="Download File"
                  className="px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <NavIcon name="download" className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  title="Delete"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <NavIcon name="close" className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Material Modal */}
      <Modal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        title="Upload Course Study Material"
        maxWidth="md"
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Document / Material Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Linear Algebra Week 6 Lecture Notes & Proofs"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">Target Class *</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
              >
                <option value="MTH301">MTH301 (Advanced Mathematics)</option>
                <option value="PHY201">PHY201 (Physics Lab)</option>
                <option value="MTH101">MTH101 (Introductory Calculus)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 mb-1">File Format</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22] bg-white"
              >
                <option value="PDF">PDF Document</option>
                <option value="DOCX">Word Document (.docx)</option>
                <option value="PPTX">PowerPoint Slides (.pptx)</option>
                <option value="ZIP">Archive (.zip)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 mb-1">Estimated File Size</label>
            <input
              type="text"
              value={fileSize}
              onChange={(e) => setFileSize(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-[#B81D22]"
            />
          </div>

          <div className="border-2 border-dashed border-zinc-200 rounded-2xl p-6 text-center bg-zinc-50 hover:bg-zinc-100/50 transition-colors cursor-pointer">
            <NavIcon name="book" className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
            <p className="text-xs font-bold text-zinc-700">Click to browse or drag file here</p>
            <p className="text-[10px] text-zinc-400 mt-1">Supports PDF, DOCX, PPTX up to 50MB</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setIsUploadOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-bold hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#B81D22] text-white text-xs font-bold hover:bg-[#9E1519]"
            >
              Confirm Upload
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
