'use client';

import { useState, useEffect } from 'react';
import { Film, Screening } from '@/types/cinema';
import { fetchAPI } from '@/utils/api';
import ScreeningRow from './ScreeningRow';

interface FilmCardProps {
  slug: string;
}

interface FilmDetail extends Film {
  screenings?: Screening[];
}

export default function FilmCard({ slug }: FilmCardProps) {
  const [film, setFilm] = useState<FilmDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAPI(`/films/${slug}`)
      .then(data => { if (!cancelled) setFilm(data); })
      .catch(err => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <div className="p-4 text-sm text-gray-500">Loading film...</div>;
  if (error) return <div className="p-4 text-sm text-red-500">Error: {error}</div>;
  if (!film) return null;

  // Filter out past screenings, then group by cinema name
  const now = new Date();
  const futureScreenings = (film.screenings || []).filter(s => new Date(s.showtime) >= now);

  const byCinema: Record<string, Screening[]> = {};
  futureScreenings.forEach(s => {
    if (!byCinema[s.cinema_name]) byCinema[s.cinema_name] = [];
    byCinema[s.cinema_name].push(s);
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        {film.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={film.poster_url}
            alt={film.title}
            className="w-20 h-28 object-cover rounded-lg shadow-sm shrink-0"
          />
        )}
        <div>
          <h3 className="font-bold text-lg text-gray-900">{film.title}</h3>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {film.year && <span className="text-xs text-gray-500">{film.year}</span>}
            {film.certificate && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 border border-gray-400 text-gray-600 rounded">
                {film.certificate}
              </span>
            )}
            {film.duration_mins && (
              <span className="text-xs text-gray-500">{film.duration_mins} min</span>
            )}
          </div>
          {film.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {film.tags.map(tag => (
                <span key={tag} className="text-[10px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                  {tag.replace('_', ' ')}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {film.synopsis && (
        <p className="text-xs text-gray-600 leading-relaxed">{film.synopsis}</p>
      )}

      {Object.keys(byCinema).length > 0 ? (
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-gray-700 border-b border-gray-200 pb-1">Screenings</h4>
          {Object.entries(byCinema).map(([name, screenings]) => (
            <div key={name}>
              <h5 className="font-medium text-sm text-gray-800 mb-1">{name}</h5>
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
