'use client';

import { useState } from 'react';

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <header className="bg-gray-900 text-white px-5 py-3 flex items-center gap-5 z-50 relative">
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center text-lg">
          <span role="img" aria-label="cinema">🎬</span>
        </div>
        <h1 className="font-bold text-lg hidden sm:block tracking-tight">
          OpenCinema
        </h1>
      </div>

      {/* Search */}
      <form onSubmit={handleSubmit} className="flex-1 max-w-xl">
        <div className="relative group">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              onSearch(e.target.value);
            }}
            placeholder="Search films, cinemas..."
            className="w-full pl-11 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-all"
          />
        </div>
      </form>
    </header>
  );
}
