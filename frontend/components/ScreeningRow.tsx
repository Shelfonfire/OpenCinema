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

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-sm font-medium text-gray-800">{time}</span>
      {screening.format && screening.format !== 'standard' && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
          {screening.format.toUpperCase()}
        </span>
      )}
      {screening.booking_url && (
        <a
          href={screening.booking_url}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto text-[11px] font-semibold text-amber-600 hover:text-amber-700 px-2 py-1 bg-amber-50 rounded hover:bg-amber-100 transition-colors"
        >
          Book
        </a>
      )}
    </div>
  );
}
