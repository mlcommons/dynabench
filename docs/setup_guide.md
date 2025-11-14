## Dynabench – Development Setup Guide

This guide walks you from zero to a running local Dynabench environment.

Order of operations:
1) Start MySQL in Docker
2) Seed the database with the provided SQL
3) Run the legacy API backend (Bottle) with uv
4) Run the modern Backend (FastAPI) with uv
5) Run the Frontend with npm

You’ll open two terminal windows for the two backends, plus one for the frontend.

---

### Prerequisites
- Docker Desktop (or compatible Docker)
- MySQL client (e.g., `mysql` CLI; on macOS: `brew install mysql-client`)
- uv (Python package manager): `curl -LsSf https://astral.sh/uv/install.sh | sh`
- Node.js 18 and npm (install via nvm recommended)

---

### 1) Start MySQL 8.0 in Docker

```bash
docker volume create dynabench-mysql

docker run -d --name dynabench-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=dynabench \
  -e MYSQL_USER=dynabench \
  -e MYSQL_PASSWORD=dynabench \
  -v dynabench-mysql:/var/lib/mysql \
  mysql:8.0 \
  --default-authentication-plugin=mysql_native_password \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci \
  --sql-mode=""
```

Why these flags?
- `mysql_native_password`: maximum client compatibility
- `utf8mb4` + `utf8mb4_unicode_ci`: full Unicode support
- `--sql-mode=""`: avoid strict-mode quirks in local dev

Verify the container is up:
```bash
docker ps
```

---

### 2) Seed the database (one-time)

Use the seed file included in the repo:

```bash
mysql -h 127.0.0.1 -P 3306 -u dynabench -pdynabench dynabench \
  < backend/resources/dbs/db.sql
```

---

### 3) Create `.env` files

Each project directory includes a ready-to-use `.env.example`. Copy it to `.env`:

```bash
cd api && cp .env.example .env && cd -
cd backend && cp .env.example .env && cd -
```

If you’re running the frontend locally, copy its example too:

```bash
cd frontends/web && cp .env.example .env && cd -
```

The examples are pre-filled for a local Docker MySQL on `127.0.0.1:3306`. Adjust only if you changed the Docker settings.

---

### 4) Run the legacy API backend (Bottle) with uv

Open Terminal A:

```bash
cd api
uv sync           # installs from pyproject/uv.lock
uv run python server.py dev
```

This serves the legacy API at `https://localhost:8081` (self‑signed cert in dev; accept the browser warning if you hit it via HTTPS).

---

### 5) Run the modern Backend (FastAPI) with uv

Open Terminal B:

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

This serves the modern API at `http://localhost:8000`. Swagger UI: `http://localhost:8000/docs`.

---

### 6) Run the Frontend

Open Terminal C:

```bash
cd frontends/web
nvm install 18
nvm use 18
npm install
npm start
```

The frontend runs at `https://localhost:3000`. It is configured to talk to the legacy API by default; the app also uses the modern backend for newer endpoints.

---

### Sanity checks
- DB: `mysql -h 127.0.0.1 -P 3306 -u dynabench -pdynabench -e "SELECT 1" dynabench`
- FastAPI root: open  `http://localhost:8000/` in a browser
- Legacy API example: open `https://localhost:8081/` in a browser

---

### That’s it
You now have:
- MySQL 8.0 (Docker) with seeded schema/data
- Legacy API on `https://localhost:8081`
- Modern Backend on `http://localhost:8000`
- Frontend on `https://localhost:3000`
