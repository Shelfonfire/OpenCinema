"""FastAPI backend for OpenCinema - serves cinema/film/screening data from SQLite."""
import os
import sqlite3
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.routing import APIRouter

# Models — in Lambda these are bundled alongside backend/
try:
    from backend.models import CinemaOut, FilmOut, ScreeningOut, TagCount
except ImportError:
    # Local dev: import from cinemadb
    CINEMADB_PATH = Path(__file__).parent.parent.parent / "mcp" / "cinemadb"
    sys.path.insert(0, str(CINEMADB_PATH))
    from models import CinemaOut, FilmOut, ScreeningOut, TagCount

DB_PATH = os.environ.get(
    "CINEMA_DB_PATH",
    str(Path(__file__).parent.parent.parent / "mcp" / "cinemadb" / "cinema.db"),
)
DATA_BUCKET = os.environ.get("DATA_BUCKET", "")


def _ensure_db():
    """In Lambda: download cinema.db from S3 to /tmp if not present."""
    if DATA_BUCKET and not os.path.exists(DB_PATH):
        import boto3
        s3 = boto3.client("s3")
        s3.download_file(DATA_BUCKET, "cinema.db", DB_PATH)


app = FastAPI(title="OpenCinema API", version="0.1.0")
api = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db() -> sqlite3.Connection:
    _ensure_db()
    conn = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    return conn


# ---------- Cinemas ----------

@api.get("/cinemas", response_model=list[CinemaOut])
def list_cinemas():
    db = get_db()
    rows = db.execute("""
        SELECT c.*,
            (SELECT COUNT(*) FROM screenings s
             WHERE s.cinema_id = c.id AND s.showtime >= datetime('now')) as screening_count
        FROM cinemas c ORDER BY c.name
    """).fetchall()
    db.close()
    return [CinemaOut(**dict(r)) for r in rows]


@api.get("/cinemas/{slug}")
def get_cinema(slug: str):
    db = get_db()
    cinema = db.execute("SELECT * FROM cinemas WHERE slug=?", (slug,)).fetchone()
    if not cinema:
        raise HTTPException(404, "Cinema not found")
    screenings = db.execute("""
        SELECT s.*, f.title as film_title, f.slug as film_slug, f.poster_url
        FROM screenings s JOIN films f ON f.id = s.film_id
        WHERE s.cinema_id=? AND s.showtime >= datetime('now')
        ORDER BY s.showtime
    """, (cinema["id"],)).fetchall()
    db.close()
    return {
        **dict(cinema),
        "screenings": [dict(s) for s in screenings],
    }


# ---------- Films ----------

@api.get("/films", response_model=list[FilmOut])
def list_films(
    q: Optional[str] = None,
    tags: Optional[str] = None,
    date_filter: Optional[str] = Query(None, alias="date"),
):
    db = get_db()
    query = """
        SELECT DISTINCT f.*,
            GROUP_CONCAT(DISTINCT ft.tag) as tag_list
        FROM films f
        LEFT JOIN film_tags ft ON ft.film_id = f.id
        LEFT JOIN screenings s ON s.film_id = f.id
        WHERE 1=1
    """
    params: list = []

    if q:
        query += " AND f.title LIKE ?"
        params.append(f"%{q}%")

    if date_filter:
        query += " AND DATE(s.showtime) = ?"
        params.append(date_filter)

    query += " GROUP BY f.id ORDER BY f.title"

    rows = db.execute(query, params).fetchall()
    db.close()

    tag_set = set(tags.split(",")) if tags else None
    results = []
    for r in rows:
        film_tags = r["tag_list"].split(",") if r["tag_list"] else []
        if tag_set and not tag_set.intersection(film_tags):
            continue
        results.append(FilmOut(
            id=r["id"], title=r["title"], slug=r["slug"],
            year=r["year"], duration_mins=r["duration_mins"],
            certificate=r["certificate"], poster_url=r["poster_url"],
            synopsis=r["synopsis"], tags=film_tags,
        ))
    return results


@api.get("/films/{slug}")
def get_film(slug: str):
    db = get_db()
    film = db.execute("SELECT * FROM films WHERE slug=?", (slug,)).fetchone()
    if not film:
        raise HTTPException(404, "Film not found")
    tags = [r["tag"] for r in db.execute(
        "SELECT tag FROM film_tags WHERE film_id=?", (film["id"],)
    ).fetchall()]
    screenings = db.execute("""
        SELECT s.*, c.name as cinema_name, c.slug as cinema_slug,
               c.latitude, c.longitude
        FROM screenings s JOIN cinemas c ON c.id = s.cinema_id
        WHERE s.film_id=? AND s.showtime >= datetime('now')
        ORDER BY s.showtime
    """, (film["id"],)).fetchall()
    db.close()
    return {
        **dict(film),
        "tags": tags,
        "screenings": [dict(s) for s in screenings],
    }


# ---------- Screenings ----------

@api.get("/screenings", response_model=list[ScreeningOut])
def list_screenings(
    date_filter: Optional[str] = Query(None, alias="date"),
    from_time: Optional[str] = None,
    to_time: Optional[str] = None,
    tags: Optional[str] = None,
    cinema_id: Optional[int] = None,
    q: Optional[str] = None,
):
    db = get_db()
    query = """
        SELECT s.id, s.showtime, s.booking_url, s.format,
               f.title as film_title, f.slug as film_slug,
               c.name as cinema_name, c.slug as cinema_slug,
               c.latitude, c.longitude,
               GROUP_CONCAT(DISTINCT ft.tag) as tag_list
        FROM screenings s
        JOIN films f ON f.id = s.film_id
        JOIN cinemas c ON c.id = s.cinema_id
        LEFT JOIN film_tags ft ON ft.film_id = f.id
        WHERE s.showtime >= datetime('now')
    """
    params: list = []

    if date_filter:
        query += " AND DATE(s.showtime) = ?"
        params.append(date_filter)

    if from_time:
        query += " AND TIME(s.showtime) >= ?"
        params.append(from_time)

    if to_time:
        query += " AND TIME(s.showtime) <= ?"
        params.append(to_time)

    if cinema_id:
        query += " AND s.cinema_id = ?"
        params.append(cinema_id)

    if q:
        query += " AND f.title LIKE ?"
        params.append(f"%{q}%")

    query += " GROUP BY s.id ORDER BY s.showtime"

    rows = db.execute(query, params).fetchall()
    db.close()

    tag_set = set(tags.split(",")) if tags else None
    results = []
    for r in rows:
        film_tags = r["tag_list"].split(",") if r["tag_list"] else []
        if tag_set and not tag_set.intersection(film_tags):
            continue
        results.append(ScreeningOut(
            id=r["id"], film_title=r["film_title"], film_slug=r["film_slug"],
            cinema_name=r["cinema_name"], cinema_slug=r["cinema_slug"],
            showtime=r["showtime"], booking_url=r["booking_url"],
            format=r["format"], latitude=r["latitude"], longitude=r["longitude"],
            tags=film_tags,
        ))
    return results


# ---------- Tags ----------

@api.get("/tags", response_model=list[TagCount])
def list_tags():
    db = get_db()
    rows = db.execute("""
        SELECT ft.tag, COUNT(DISTINCT ft.film_id) as count
        FROM film_tags ft
        JOIN films f ON f.id = ft.film_id
        JOIN screenings s ON s.film_id = f.id AND s.showtime >= datetime('now')
        GROUP BY ft.tag ORDER BY count DESC
    """).fetchall()
    db.close()
    return [TagCount(tag=r["tag"], count=r["count"]) for r in rows]


@api.get("/health")
def health():
    return {"status": "ok"}


app.include_router(api)


# Lambda handler via Mangum
try:
    from mangum import Mangum
    handler = Mangum(app)
except ImportError:
    pass
