# Stage 1: Build frontend
FROM node:20-slim AS frontend
WORKDIR /build
COPY opencinema/frontend/package*.json ./
RUN npm ci
COPY opencinema/frontend/ ./
RUN npm run build

# Stage 2: Runtime
FROM python:3.12-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && \
    rm -rf /var/lib/apt/lists/*

COPY opencinema/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY opencinema/backend/ ./backend/
COPY --from=frontend /build/out ./static/

RUN mkdir -p /data

ENV CINEMA_DB_PATH=/data/cinema.db
EXPOSE 8080

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8080"]
