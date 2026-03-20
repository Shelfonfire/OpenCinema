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

  // Group screenings by film title
  const byFilm: Record<string, Screening[]> = {};
  (cinema.screenings || []).forEach(s => {
    if (!byFilm[s.film_title]) byFilm[s.film_title] = [];
    byFilm[s.film_title].push(s);
  });

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
        {cinema.website && (
          <a
            href={cinema.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 mt-1"
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Website
          </a>
        )}
      </div>

      {Object.keys(byFilm).length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 border-b border-gray-200 pb-1">Screenings</h4>
          {Object.entries(byFilm).map(([title, screenings]) => (
            <div key={title}>
              <h5 className="font-medium text-sm text-gray-800 mb-1">{title}</h5>
              <div className="pl-2 border-l-2 border-amber-200">
                {screenings
                  .sort((a, b) => a.showtime.localeCompare(b.showtime))
                  .map(s => <ScreeningRow key={s.id} screening={s} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400">No screenings found</p>
      )}
    </div>
  );
}
