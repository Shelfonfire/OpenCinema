'use client';

import { useState, useEffect } from 'react';
import { Cinema, Screening } from '@/types/cinema';
import { fetchAPI } from '@/utils/api';
import ScreeningRow from './ScreeningRow';

interface CinemaCardProps {
  slug: string;
}

interface CinemaDetail extends Cinema {
  screenings?: Screening[];
}

export default function CinemaCard({ slug }: CinemaCardProps) {
  const [cinema, setCinema] = useState<CinemaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAPI(`/cinemas/${slug}`)
      .then(data => { if (!cancelled) setCinema(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading cinema...</div>;
  if (error) return <div className="p-4 text-sm text-red-500">Error: {error}</div>;
  if (!cinema) return null;

  // Filter out past screenings, then group by film title
  const now = new Date();
  const futureScreenings = (cinema.screenings || []).filter(s => new Date(s.showtime) >= now);

  const byFilm: Record<string, Screening[]> = {};
  futureScreenings.forEach(s => {
    if (!byFilm[s.film_title]) byFilm[s.film_title] = [];
    byFilm[s.film_title].push(s);
  });

  const formatDateLabel = (isoDate: string) => {
    const d = new Date(isoDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const screenDate = new Date(d);
    screenDate.setHours(0, 0, 0, 0);
    if (screenDate.getTime() === today.getTime()) return 'Today';
    const day = d.toLocaleDateString('en-GB', { weekday: 'long' });
    const date = d.getDate();
    const suffix = date === 1 || date === 21 || date === 31 ? 'st' : date === 2 || date === 22 ? 'nd' : date === 3 || date === 23 ? 'rd' : 'th';
    return `${day} ${date}${suffix}`;
  };

  const groupByDate = (screenings: Screening[]) => {
    const sorted = [...screenings].sort((a, b) => a.showtime.localeCompare(b.showtime));
    const groups: Record<string, Screening[]> = {};
    sorted.forEach(s => {
      const dateKey = s.showtime.slice(0, 10);
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(s);
    });
    return groups;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold text-lg text-gray-900">{cinema.name}</h3>
        {cinema.chain && (
          <span className="text-xs font-medium text-gray-500 capitalize">{cinema.chain}</span>
        )}
        {cinema.area && (
          <p className="text-xs text-gray-500 mt-0.5">{cinema.area}{cinema.postcode ? `, ${cinema.postcode}` : ''}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([cinema.name, cinema.area, cinema.postcode].filter(Boolean).join(', '))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 px-2 py-1 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Maps
          </a>
          {cinema.website && (
            <a
              href={cinema.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700 px-2 py-1 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Website
            </a>
          )}
        </div>
      </div>

      {Object.keys(byFilm).length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 border-b border-gray-200 pb-1">Screenings</h4>
          {Object.entries(byFilm).map(([title, screenings]) => {
            const dateGroups = groupByDate(screenings);
            return (
              <div key={title}>
                <h5 className="font-medium text-sm text-gray-800 mb-1">{title}</h5>
                <div className="pl-2 border-l-2 border-amber-200">
                  {Object.entries(dateGroups).map(([dateKey, shows]) => (
                    <div key={dateKey}>
                      <p className="text-[11px] font-semibold text-gray-500 mt-1.5 mb-0.5">{formatDateLabel(dateKey)}</p>
                      {shows.map(s => <ScreeningRow key={s.id} screening={s} />)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No screenings found</p>
      )}
    </div>
  );
}
