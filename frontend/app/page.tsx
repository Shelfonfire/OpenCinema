'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import FilterBar from '@/components/FilterBar';
import dynamic from 'next/dynamic';
import { Filters } from '@/types/cinema';

const CinemaMap = dynamic(() => import('@/components/CinemaMap'), { ssr: false });

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Filters>({
    date: todayStr(),
    fromTime: '',
    toTime: '',
    tags: [],
  });

  return (
    <div className="relative min-h-screen flex flex-col">
      <Header onSearch={setSearchQuery} />
      <FilterBar filters={filters} onFilterChange={setFilters} />
      <main className="flex-1 relative">
        <CinemaMap searchQuery={searchQuery} filters={filters} />
      </main>
    </div>
  );
}
