'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-markercluster';
import L from 'leaflet';
import { Cinema, Screening, Filters } from '@/types/cinema';
import { fetchAPI } from '@/utils/api';
import CinemaCard from './CinemaCard';
import FilmCard from './FilmCard';

interface CinemaMapProps {
  searchQuery: string;
  filters: Filters;
}

const LONDON_CENTER: [number, number] = [51.515, -0.09];
const DEFAULT_ZOOM = 12;

type SidebarTab = 'cinemas' | 'films';

function getChainClass(chain: string | null): string {
  if (!chain) return 'cinema-marker-independent';
  const c = chain.toLowerCase();
  if (c.includes('everyman')) return 'cinema-marker-everyman';
  if (c.includes('picturehouse')) return 'cinema-marker-picturehouse';
  if (c.includes('curzon')) return 'cinema-marker-curzon';
  if (c.includes('odeon')) return 'cinema-marker-odeon';
  return 'cinema-marker-default';
}

function createCinemaIcon(chain: string | null): L.DivIcon {
  const chainClass = getChainClass(chain);
  return L.divIcon({
    className: 'cinema-marker',
    html: `<div class="cinema-marker-inner ${chainClass}">🎬</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

function SidebarCinemaItem({
  cinema,
  isSelected,
  onClick,
  todayCount,
  totalCount,
}: {
  cinema: Cinema;
  isSelected: boolean;
  onClick: () => void;
  todayCount: number;
  totalCount: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 transition-all border-b border-gray-100 hover:bg-amber-50/40
        ${isSelected ? 'bg-amber-50 border-l-[3px] border-l-amber-500' : 'border-l-[3px] border-l-transparent'}
        ${totalCount === 0 ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight">{cinema.name}</h4>
        {totalCount > 0 && (
          <div className="flex gap-1 shrink-0">
            {todayCount > 0 && (
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                {todayCount} today
              </span>
            )}
            <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
              {totalCount} total
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {cinema.chain && (
          <span className="text-[11px] text-gray-500 capitalize">{cinema.chain}</span>
        )}
        {cinema.area && (
          <span className="text-[11px] text-gray-400">
            {cinema.chain ? ' · ' : ''}{cinema.area}
          </span>
        )}
      </div>
    </button>
  );
}

interface FilmSummary {
  film_title: string;
  film_slug: string;
  screeningCount: number;
  cinemaCount: number;
  cinemaSlugs: Set<string>;
}

function SidebarFilmItem({
  film,
  isSelected,
  onClick,
}: {
  film: FilmSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 transition-all border-b border-gray-100 hover:bg-amber-50/40
        ${isSelected ? 'bg-amber-50 border-l-[3px] border-l-amber-500' : 'border-l-[3px] border-l-transparent'}`}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <h4 className="font-semibold text-sm text-gray-900 leading-tight">{film.film_title}</h4>
        <div className="flex gap-1 shrink-0">
          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
            {film.screeningCount} screening{film.screeningCount !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      <span className="text-[11px] text-gray-500">
        {film.cinemaCount} cinema{film.cinemaCount !== 1 ? 's' : ''}
      </span>
    </button>
  );
}

export default function CinemaMap({ searchQuery, filters }: CinemaMapProps) {
  const [cinemas, setCinemas] = useState<Cinema[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [allScreenings, setAllScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCinemaSlug, setSelectedCinemaSlug] = useState<string | null>(null);
  const [selectedFilmSlug, setSelectedFilmSlug] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('cinemas');
  const [filmFilter, setFilmFilter] = useState<string | null>(null); // film_slug to filter by
  const listRef = useRef<HTMLDivElement>(null);

  // Fetch cinemas + all upcoming screenings on mount
  useEffect(() => {
    Promise.all([
      fetchAPI('/cinemas'),
      fetchAPI('/screenings'),
    ])
      .then(([c, s]) => { setCinemas(c); setAllScreenings(s); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Fetch filtered screenings when filters change
  useEffect(() => {
    const params: Record<string, string> = {};
    if (filters.date) params.date = filters.date;
    if (filters.fromTime) params.from_time = filters.fromTime;
    if (filters.toTime) params.to_time = filters.toTime;
    if (filters.tags.length > 0) params.tags = filters.tags.join(',');

    fetchAPI('/screenings', params)
      .then(setScreenings)
      .catch(() => setScreenings([]));
  }, [filters]);

  // Build film summaries from future screenings this week, ordered by count
  const filmSummaries = useMemo(() => {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
    endOfWeek.setHours(23, 59, 59, 999);

    const filmMap: Record<string, FilmSummary> = {};
    allScreenings.forEach(s => {
      const showtime = new Date(s.showtime);
      if (showtime < now) return;
      if (showtime > endOfWeek) return;
      if (!filmMap[s.film_slug]) {
        filmMap[s.film_slug] = {
          film_title: s.film_title,
          film_slug: s.film_slug,
          screeningCount: 0,
          cinemaCount: 0,
          cinemaSlugs: new Set(),
        };
      }
      filmMap[s.film_slug].screeningCount++;
      filmMap[s.film_slug].cinemaSlugs.add(s.cinema_slug);
    });

    // Set cinemaCount from set size
    Object.values(filmMap).forEach(f => { f.cinemaCount = f.cinemaSlugs.size; });

    return Object.values(filmMap).sort((a, b) => b.screeningCount - a.screeningCount);
  }, [allScreenings]);

  // Get cinema slugs that have the filtered film
  const filmFilterCinemaSlugs = useMemo(() => {
    if (!filmFilter) return null;
    const match = filmSummaries.find(f => f.film_slug === filmFilter);
    return match ? match.cinemaSlugs : null;
  }, [filmFilter, filmSummaries]);

  // Filter cinemas by search + film filter
  const filteredCinemas = useMemo(() => {
    let result = cinemas;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.chain?.toLowerCase().includes(q) ||
        c.area?.toLowerCase().includes(q)
      );
    }
    if (filmFilterCinemaSlugs) {
      result = result.filter(c => filmFilterCinemaSlugs.has(c.slug));
    }
    return result;
  }, [cinemas, searchQuery, filmFilterCinemaSlugs]);

  // Compute per-cinema screening counts (today + total, excluding past)
  const screeningCounts = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const counts: Record<string, { today: number; total: number }> = {};

    allScreenings.forEach(s => {
      if (new Date(s.showtime) < now) return;
      const key = s.cinema_slug;
      if (!counts[key]) counts[key] = { today: 0, total: 0 };
      counts[key].total++;
      if (s.showtime.slice(0, 10) === todayStr) counts[key].today++;
    });

    return counts;
  }, [allScreenings]);

  // Sort: cinemas with screenings first, then by name
  const sortedCinemas = useMemo(() => {
    return [...filteredCinemas].sort((a, b) => {
      const aTotal = screeningCounts[a.slug]?.total ?? 0;
      const bTotal = screeningCounts[b.slug]?.total ?? 0;
      if (aTotal > 0 && bTotal === 0) return -1;
      if (aTotal === 0 && bTotal > 0) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [filteredCinemas, screeningCounts]);

  // Cinemas with valid coordinates
  const mappableCinemas = useMemo(
    () => sortedCinemas.filter(c => c.latitude != null && c.longitude != null),
    [sortedCinemas]
  );

  const handleSelectCinema = (cinema: Cinema) => {
    setSelectedCinemaSlug(cinema.slug);
    setSelectedFilmSlug(null);
  };

  const handleSelectFilm = (film: FilmSummary) => {
    // Toggle: clicking the same film clears the filter
    if (filmFilter === film.film_slug) {
      setFilmFilter(null);
      setSelectedFilmSlug(null);
    } else {
      setFilmFilter(film.film_slug);
      setSelectedFilmSlug(film.film_slug);
      setSelectedCinemaSlug(null);
    }
  };

  const clearFilmFilter = () => {
    setFilmFilter(null);
  };

  const closePanel = () => {
    setSelectedCinemaSlug(null);
    setSelectedFilmSlug(null);
  };

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading cinemas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-100px)] flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-xl shadow">
          <p className="text-red-500 mb-3 text-sm">Error: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm hover:bg-amber-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const activeFilmTitle = filmFilter ? filmSummaries.find(f => f.film_slug === filmFilter)?.film_title : null;

  return (
    <div className="w-full h-[calc(100vh-100px)] relative flex">
      {/* Sidebar */}
      <div className="hidden lg:flex flex-col w-80 bg-white border-r border-gray-200 shrink-0">
        {/* Tab headers */}
        <div className="flex border-b border-gray-200 bg-white sticky top-0 z-10">
          <button
            onClick={() => setSidebarTab('cinemas')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors
              ${sidebarTab === 'cinemas'
                ? 'text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            Cinemas
            <span className="ml-1.5 text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {filteredCinemas.length}
            </span>
          </button>
          <button
            onClick={() => setSidebarTab('films')}
            className={`flex-1 px-4 py-3 text-sm font-bold transition-colors
              ${sidebarTab === 'films'
                ? 'text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-500 hover:text-gray-700'}`}
          >
            Films
            <span className="ml-1.5 text-[11px] font-medium text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
              {filmSummaries.length}
            </span>
          </button>
        </div>

        {/* Film filter banner */}
        {filmFilter && activeFilmTitle && (
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-amber-800 truncate">
              Showing cinemas for: {activeFilmTitle}
            </span>
            <button
              onClick={clearFilmFilter}
              className="shrink-0 text-[10px] font-bold text-amber-600 hover:text-amber-800 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Tab content */}
        <div ref={listRef} className="flex-1 overflow-y-auto">
          {sidebarTab === 'cinemas' ? (
            (() => {
              const withScreenings = sortedCinemas.filter(c => (screeningCounts[c.slug]?.total ?? 0) > 0);
              return withScreenings.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-gray-400">No cinemas found</p>
                </div>
              ) : (
                withScreenings.map((cinema) => (
                  <SidebarCinemaItem
                    key={cinema.id}
                    cinema={cinema}
                    isSelected={selectedCinemaSlug === cinema.slug}
                    onClick={() => handleSelectCinema(cinema)}
                    todayCount={screeningCounts[cinema.slug]?.today ?? 0}
                    totalCount={screeningCounts[cinema.slug]?.total ?? 0}
                  />
                ))
              );
            })()
          ) : (
            filmSummaries.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-400">No films this week</p>
              </div>
            ) : (
              filmSummaries.map((film) => (
                <SidebarFilmItem
                  key={film.film_slug}
                  film={film}
                  isSelected={filmFilter === film.film_slug}
                  onClick={() => handleSelectFilm(film)}
                />
              ))
            )
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={LONDON_CENTER}
          zoom={DEFAULT_ZOOM}
          className="w-full h-full"
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MarkerClusterGroup>
            {mappableCinemas.map((cinema) => (
              <Marker
                key={cinema.id}
                position={[cinema.latitude!, cinema.longitude!]}
                icon={createCinemaIcon(cinema.chain)}
                eventHandlers={{
                  click: () => handleSelectCinema(cinema),
                }}
              >
                <Popup>
                  <div className="font-semibold text-sm">{cinema.name}</div>
                  {cinema.chain && <div className="text-xs text-gray-500 capitalize">{cinema.chain}</div>}
                  {cinema.area && <div className="text-xs text-gray-400">{cinema.area}</div>}
                  <div className="text-xs text-amber-600 mt-1">{cinema.screening_count} screenings</div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Cinema count badge - mobile */}
        <div className="absolute bottom-4 left-4 z-[1000] lg:hidden bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow text-xs text-gray-600 font-medium">
          {sortedCinemas.length} cinema{sortedCinemas.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Right panel - cinema or film detail */}
      {(selectedCinemaSlug || selectedFilmSlug) && (
        <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto hidden md:block shadow-lg animate-slide-in">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center z-10">
            <h2 className="font-bold text-sm text-gray-900 truncate">
              {selectedFilmSlug ? 'Film Details' : 'Cinema Details'}
            </h2>
            <button
              onClick={closePanel}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            {selectedFilmSlug ? (
              <FilmCard slug={selectedFilmSlug} />
            ) : selectedCinemaSlug ? (
              <CinemaCard slug={selectedCinemaSlug} />
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
