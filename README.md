# OpenCinema

London cinema screenings on a map. Filter by date, time, tags (indie, classic, foreign, blockbuster). 48 cinemas, 10 scrapers.

**Live**: https://d3j0dexak5doxz.cloudfront.net

## Architecture

```
frontend/     Next.js 14 + Leaflet → S3 + CloudFront
backend/      FastAPI + SQLite → Lambda + API Gateway
deploy/       Terraform (AWS) + Dockerfile + CI/CD
```

Scrapers live in `../mcp/cinemadb/` — 10 Python scrapers covering Everyman/Curzon, Picturehouse, Peckhamplex, Savoy Systems, Prince Charles, Barbican, Castle, The Nickel, Riverside, Deptford.

## Quick start

```bash
# Backend
cd backend && pip install -r requirements.txt
uvicorn backend.main:app --reload

# Frontend
cd frontend && npm install && npm run dev

# Scrape data
cd ../mcp/cinemadb && conda run -n pyds python scrape_all.py
```

## API

| Endpoint | Returns |
|----------|---------|
| GET /api/cinemas | All cinemas with screening counts |
| GET /api/screenings?date=&tags=&q= | Filtered screenings with lat/lng |
| GET /api/films?q=&tags= | Films with screening locations |
| GET /api/tags | Available tags with counts |

## Deploy

Push to `master` → GitHub Actions deploys frontend + backend to AWS. See [deploy/README.md](deploy/README.md).
