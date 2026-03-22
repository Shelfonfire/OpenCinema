'use client';

import { Screening } from '@/types/cinema';

interface ScreeningRowProps {
  screening: Screening;
}

export default function ScreeningRow({ screening }: ScreeningRowProps) {
  const time = new Date(screening.showtime).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const formatBadge = screening.format && screening.format !== 'standard' && (
    <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
      {screening.format.toUpperCase()}
    </span>
  );

  if (screening.is_sold_out) {
    return (
      <div className="flex items-center gap-2 py-2 px-3 bg-red-50 rounded-lg my-1 border border-red-200 opacity-70">
        <span className="text-sm font-semibold text-red-400 line-through">{time}</span>
        {formatBadge}
        <span className="ml-auto text-[11px] font-semibold text-red-400">
          Sold Out
        </span>
      </div>
    );
  }

  if (screening.booking_url) {
    return (
      <a
        href={screening.booking_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 py-2 px-3 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer my-1 border border-amber-200"
      >
        <span className="text-sm font-semibold text-amber-700">{time}</span>
        {formatBadge}
        <span className="ml-auto text-[11px] font-semibold text-amber-600">
          Book →
        </span>
      </a>
    );
  }

  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg my-1">
      <span className="text-sm font-medium text-gray-800">{time}</span>
      {formatBadge}
    </div>
  );
}
