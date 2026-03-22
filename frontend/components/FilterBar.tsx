'use client';

import { useMemo } from 'react';
import { Filters } from '@/types/cinema';

interface FilterBarProps {
  filters: Filters;
  onFilterChange: (filters: Filters) => void;
}

const TAG_OPTIONS = [
  { key: 'new_release', label: 'New Release' },
  { key: 'classic', label: 'Classic' },
  { key: 'indie', label: 'Indie' },
  { key: 'foreign', label: 'Foreign' },
  { key: 'blockbuster', label: 'Blockbuster' },
  { key: 'documentary', label: 'Documentary' },
];

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function formatDateLabel(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return `${days[d.getDay()]} (${ordinal(d.getDate())})`;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Generate date options from today to 13 days out */
function dateOptions(): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    opts.push({ value: toDateStr(d), label: formatDateLabel(d) });
  }
  return opts;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const dates = useMemo(() => dateOptions(), []);

  const toggleTag = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFilterChange({ ...filters, tags });
  };

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 overflow-x-auto z-40 relative">
      {/* From date */}
      <select
        value={filters.fromDate}
        onChange={(e) => onFilterChange({ ...filters, fromDate: e.target.value })}
        className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        {dates.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>

      <span className="text-xs text-gray-400 shrink-0">→</span>

      {/* To date */}
      <select
        value={filters.toDate}
        onChange={(e) => onFilterChange({ ...filters, toDate: e.target.value })}
        className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        {dates.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
      </select>

      {/* Divider */}
      <div className="w-px h-6 bg-gray-300 shrink-0" />

      {/* Tag pills */}
      {TAG_OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => toggleTag(opt.key)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
            ${filters.tags.includes(opt.key)
              ? 'bg-amber-500 text-white'
              : 'bg-white border border-gray-300 text-gray-600 hover:border-amber-400 hover:text-amber-600'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
