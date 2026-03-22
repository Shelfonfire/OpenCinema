# OpenCinema Frontend

Next.js 14 + Leaflet map showing London cinema screenings. Static export deployed to S3/CloudFront via GitHub Actions.

## Dev

```bash
npm install
npm run dev        # http://localhost:3000
```

Needs backend running at http://localhost:8000 (set in `.env.local`). In production, uses relative `/api/*` URLs routed through CloudFront to Lambda.

## Components

| Component | Purpose |
|-----------|---------|
| CinemaMap | Leaflet map + sidebar cinema list + detail panel |
| FilterBar | Date picker, time range, tag filter pills |
| CinemaCard | Cinema detail + screenings grouped by film → date |
| FilmCard | Film detail + screenings grouped by cinema |
| Header | Search bar |
| ScreeningRow | Single screening time + format badge + booking link |

## Stack

- Next.js 14 (App Router, static export)
- Leaflet + react-leaflet + markercluster
- CARTO Voyager tiles (free, no API key)
- TailwindCSS
