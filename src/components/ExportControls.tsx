'use client';

import { useState } from 'react';

const SEMESTER_PRESETS: { label: string; from: string; to: string }[] = [
  { label: 'Fall 2025', from: '2025-08-15', to: '2025-12-31' },
  { label: 'Spring 2026', from: '2026-01-01', to: '2026-05-31' },
  { label: 'Fall 2026', from: '2026-08-15', to: '2026-12-31' },
];

export function ExportControls() {
  const [exportType, setExportType] = useState<'events' | 'expenses'>('events');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  function applySemester(preset: (typeof SEMESTER_PRESETS)[0]) {
    setFrom(preset.from);
    setTo(preset.to);
  }

  function handleExport() {
    const params = new URLSearchParams();
    params.set('type', exportType);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    window.open(`/api/exports?${params.toString()}`, '_blank');
  }

  return (
    <div className="card p-6">
      <h2 className="section-title mb-4">Export Data</h2>

      {/* Export type */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Data Type</label>
        <div className="flex gap-3">
          <button
            onClick={() => setExportType('events')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              exportType === 'events'
                ? 'bg-yale-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Events
          </button>
          <button
            onClick={() => setExportType('expenses')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              exportType === 'expenses'
                ? 'bg-yale-blue text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Expenses
          </button>
        </div>
      </div>

      {/* Semester presets */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Quick Select Semester</label>
        <div className="flex flex-wrap gap-2">
          {SEMESTER_PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => applySemester(p)}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-blue-50 text-yale-blue hover:bg-blue-100 transition"
            >
              {p.label}
            </button>
          ))}
          <button
            onClick={() => { setFrom(''); setTo(''); }}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
          >
            All Time
          </button>
        </div>
      </div>

      {/* Date range */}
      <div className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <label htmlFor="export-from" className="block text-sm font-medium text-gray-700 mb-1">
            From
          </label>
          <input
            id="export-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label htmlFor="export-to" className="block text-sm font-medium text-gray-700 mb-1">
            To
          </label>
          <input
            id="export-to"
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="input"
          />
        </div>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="btn-primary flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
        Download {exportType === 'events' ? 'Events' : 'Expenses'} CSV
      </button>

      <p className="text-xs text-gray-400 mt-3">
        Leave dates empty to export all data. CSV files can be opened in Excel or Google Sheets.
      </p>
    </div>
  );
}
