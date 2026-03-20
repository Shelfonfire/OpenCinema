"""Pydantic response models for OpenCinema API."""
from typing import Optional

from pydantic import BaseModel


class CinemaOut(BaseModel):
    id: int
    name: str
    slug: str
    chain: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    area: Optional[str] = None
    postcode: Optional[str] = None
    website: Optional[str] = None
    screening_count: int = 0


class FilmOut(BaseModel):
    id: int
    title: str
    slug: str
    year: Optional[int] = None
    duration_mins: Optional[int] = None
    certificate: Optional[str] = None
    poster_url: Optional[str] = None
    synopsis: Optional[str] = None
    tags: list[str] = []


class ScreeningOut(BaseModel):
    id: int
    film_title: str
    film_slug: str
    cinema_name: str
    cinema_slug: str
    showtime: str
    booking_url: Optional[str] = None
    format: str = "standard"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    tags: list[str] = []


class TagCount(BaseModel):
    tag: str
    count: int
