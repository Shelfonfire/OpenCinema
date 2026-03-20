export interface Cinema {
  id: number;
  name: string;
  slug: string;
  chain: string | null;
  latitude: number | null;
  longitude: number | null;
  area: string | null;
  postcode: string | null;
  website: string | null;
  screening_count: number;
}

export interface Film {
  id: number;
  title: string;
  slug: string;
  year: number | null;
  duration_mins: number | null;
  certificate: string | null;
  poster_url: string | null;
  synopsis: string | null;
  tags: string[];
}

export interface Screening {
  id: number;
  film_title: string;
  film_slug: string;
  cinema_name: string;
  cinema_slug: string;
  showtime: string;
  booking_url: string | null;
  format: string;
  latitude: number | null;
  longitude: number | null;
  tags: string[];
}

export interface Filters {
  date: string;
  fromTime: string;
  toTime: string;
  tags: string[];
}
