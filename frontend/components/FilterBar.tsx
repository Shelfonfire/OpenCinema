'use client';

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

function timeOptions(): string[] {
  const opts: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '30']) {
      opts.push(`${h.toString().padStart(2, '0')}:${m}`);
    }
  }
  return opts;
}

const TIMES = timeOptions();

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const toggleTag = (tag: string) => {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onFilterChange({ ...filters, tags });
  };

  return (
    <div className="bg-gray-100 border-b border-gray-200 px-5 py-2.5 flex items-center gap-3 overflow-x-auto z-40 relative">
      {/* Date */}
      <input
        type="date"
        value={filters.date}
        onChange={(e) => onFilterChange({ ...filters, date: e.target.value })}
        className="shrink-0 px-3 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      />

      {/* From time */}
      <select
        value={filters.fromTime}
        onChange={(e) => onFilterChange({ ...filters, fromTime: e.target.value })}
        className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <option value="">From</option>
        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
      </select>

      {/* To time */}
      <select
        value={filters.toTime}
        onChange={(e) => onFilterChange({ ...filters, toTime: e.target.value })}
        className="shrink-0 px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30"
      >
        <option value="">To</option>
        {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
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
