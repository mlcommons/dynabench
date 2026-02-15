## Dynabench – Development Setup Guide

This guide walks you from zero to a running local Dynabench environment.

Dynabench has 4 main components: a frontend, a MySQL database, and two backend services that must run simultaneously:

1. **Legacy API** (Bottle framework) - `api/` directory
   - Handles existing functionality and data collection
   - Runs on `https://localhost:8081` (dev mode) or `https://localhost:8080` (prod mode)

2. **Modern Backend** (FastAPI framework) - `backend/` directory
   - Powers newer features and endpoints
   - Runs on `http://localhost:8000`

## Order of operations:
1) Start MySQL server
2) Seed the database with the provided SQL
3) Run the legacy API backend (Bottle)
4) Run the modern backend (FastAPI)
5) Run the frontend with npm
---

## Recommended Setup: Docker Compose (Easiest)

This is the easiest way to get Dynabench running - all services start with a single command.

### Prerequisites
- **Docker Desktop** - Follow the [official installation guide](https://docs.docker.com/get-docker/)

### Setup Steps

**1. Create `.env` files:**

```bash
cp api/.env.example api/.env
cp backend/.env.example backend/.env
```

**2. Build and start all services:**

```bash
docker-compose up --build
```

Or run in detached mode (background):
```bash
docker-compose up -d --build
```

**Note:** The backends will automatically retry if MySQL isn't ready yet. You may see a few connection errors in the logs initially - this is normal and they will connect once MySQL is ready.

**3. Seed the database** (first time only):

Wait for MySQL to be ready (watch the logs for "ready for connections"), then in another terminal:

```bash
docker exec -i dynabench-mysql mysql -u dynabench -pdynabench dynabench < backend/resources/dbs/db.sql
```

### What's Running

You now should have:
- **MySQL 8.4**: `localhost:3306`
- **Legacy API** (dev mode): `http://localhost:8081`
- **Modern Backend**: `http://localhost:8000` (Swagger UI at `/docs`)
- **Frontend**: `http://localhost:3000`

### Useful Commands

**View logs:**
```bash
docker-compose logs -f                 # All services
docker-compose logs -f api             # Legacy Bottle backend
docker-compose logs -f backend         # Modern FastAPI backend
docker-compose logs -f mysql           # Database
```

**Stop services:**
```bash
docker-compose down
```

**Stop and remove volumes (clean slate):**
```bash
docker-compose down -v
```

**Rebuild after code changes:**
```bash
docker-compose up --build
```

**Restart a specific service:**
```bash
docker-compose restart api
```

### Sanity Checks
- DB: `docker exec dynabench-mysql mysql -u dynabench -pdynabench -e "SELECT 1" dynabench`
- Legacy API: open `http://localhost:8081/` in a browser
- Modern Backend: open `http://localhost:8000/docs` in a browser
- Frontend: open `http://localhost:3000` in a browser

---

## Alternative: Individual Docker Containers

If you prefer to run Docker containers individually without Docker Compose:

### Prerequisites
- **Docker Desktop** - Follow the [official installation guide](https://docs.docker.com/get-docker/)
- **Node.js 18 and npm** - Install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended)

### 1) Start MySQL 8.4 in Docker

```bash
docker volume create dynabench-mysql

docker run -d --name dynabench-mysql \
  -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=dynabench \
  -e MYSQL_USER=dynabench \
  -e MYSQL_PASSWORD=dynabench \
  -v dynabench-mysql:/var/lib/mysql \
  mysql:8.4 \
  --mysql-native-password=ON \
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

### 2) Seed the database (one-time)

```bash
docker exec -i dynabench-mysql mysql -u dynabench -pdynabench dynabench \
  < backend/resources/dbs/db.sql
```

### 3) Create `.env` files

```bash
cp api/.env.example api/.env
cp backend/.env.example backend/.env
```

**Important:** Verify that `api/.env` and `backend/.env` have `DB_HOST=host.docker.internal` (this should be the default in `.env.example`).

The example files use `DB_HOST=host.docker.internal` which allows Docker containers to connect to the MySQL container on the host. On Linux, if you encounter connection issues, edit the `.env` files and change `host.docker.internal` to `172.17.0.1`, or use `--add-host=host.docker.internal:host-gateway` when running containers.

### 4) Build and run the backends using Docker

**Build the legacy API (Bottle):**

```bash
cd api
docker build -t dynabench-api .
cd ..
```

**Build the modern backend (FastAPI):**

```bash
cd backend
docker build -t dynabench-backend .
cd ..
```

**Run the legacy API container:**

```bash
docker run -d --name dynabench-api \
  -p 8081:8081 \
  dynabench-api
```

This serves the legacy API at `https://localhost:8081` (dev mode with self-signed cert).

**Run the modern backend container:**

```bash
docker run -d --name dynabench-backend \
  -p 8000:8000 \
  dynabench-backend
```

This serves the modern API at `http://localhost:8000`. Swagger UI: `http://localhost:8000/docs`.

**Note:** The `.env` file is copied into the Docker image at build time. If you modify the `.env` file, you must rebuild the image:
```bash
# Remove old containers
docker rm -f dynabench-api dynabench-backend

# Rebuild images
cd api && docker build -t dynabench-api . && cd ..
cd backend && docker build -t dynabench-backend . && cd ..

# Run containers again (using commands above)
```

**View logs:**

```bash
docker logs -f dynabench-api      # Legacy API logs
docker logs -f dynabench-backend  # Modern backend logs
```

**Stop containers:**

```bash
docker stop dynabench-api dynabench-backend
```

**Remove containers (for rebuild):**

```bash
docker rm dynabench-api dynabench-backend
```

### 5) Run the Frontend

To install and run the frontend, we recommend using [nvm](https://github.com/nvm-sh/nvm) (see [installation instructions](https://github.com/nvm-sh/nvm#installing-and-updating)) to manage and install Node.js versions.

Once nvm is installed:

```bash
cd frontends/web
nvm install 18
nvm use 18
nvm install-latest-npm
npm install
echo 'REACT_APP_API_HOST = "https://localhost:8081"' >> .env
npm start
```

The frontend runs at `https://localhost:3000`. It is configured to talk to the legacy API by default; the app also uses the modern backend for newer endpoints.

### Sanity checks
- DB: `docker exec dynabench-mysql mysql -u dynabench -pdynabench -e "SELECT 1" dynabench`
- Legacy API (dev mode): open `https://localhost:8081/` in a browser
- Modern Backend: open `http://localhost:8000/` in a browser (Swagger UI at `/docs`)

### That's it
You now have:
- MySQL 8.4 (Docker) with seeded schema/data
- Legacy API (Docker, dev mode) on `https://localhost:8081`
- Modern Backend (Docker) on `http://localhost:8000`
- Frontend on `https://localhost:3000`

You're almost done! The final step is to navigate to the task, admin configuration, and update the YAML file.

---

## Alternative: Local Setup with uv

If you prefer to run the backends locally without Docker:

### Prerequisites for local setup
- **uv** (Python version manager & package installer): `curl -LsSf https://astral.sh/uv/install.sh | sh`
  - uv will automatically install Python 3.13 as needed
  - **Note:** Python 3.14+ is not yet supported due to dependency compatibility issues (Pydantic V1)
- **MySQL 8.4** - See [database setup guide](database.md)
- **Node.js 18 and npm** - Install via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating) (recommended)

### Create `.env` files for local setup

Copy the `.env.example` files and update them for local MySQL:

```bash
cd api && cp .env.example .env && cd -
cd backend && cp .env.example .env && cd -
```

**Important:** Edit both `api/.env` and `backend/.env` to change the database host:
```bash
DB_HOST=127.0.0.1
```

(The `.env.example` files default to `host.docker.internal` for Docker setup)

### Run the legacy API backend (Bottle) with uv

**Standard setup:**

```bash
cd api
uv sync           # installs Python (if needed) and dependencies from pyproject/uv.lock
uv run python server.py dev
```

This serves the legacy API at `https://localhost:8081` (self‑signed cert in dev; accept the browser warning if you hit it via HTTPS).

**Alternative: Using install.py for interactive configuration**

If you need custom SSL certificates or prefer interactive setup:

1. Set up self-signed SSL certificates (if needed):
   ```bash
   mkdir ~/.ssl
   cd ~/.ssl
   openssl req -newkey rsa:2048 -x509 -new -nodes \
     -keyout local-cert.key -out local-cert.crt \
     -subj /CN=test1 -sha256 -days 365 \
     -addext "extendedKeyUsage = serverAuth"
   cat local-cert.key local-cert.crt > local-cert.pem
   chmod 600 *
   ln -s local-cert.key dynabench.org-key.pem
   ln -s local-cert.crt dynabench.org.crt
   ```

2. Run the interactive configuration script:
   ```bash
   cd api
   uv sync
   python install.py  # Prompts for db credentials and SSL paths
   python server.py dev
   ```

### Run the modern Backend (FastAPI) with uv

```bash
cd backend
uv sync
uv run uvicorn app.main:app --reload --port 8000
```

This serves the modern API at `http://localhost:8000`. Swagger UI: `http://localhost:8000/docs`.

### Run the Frontend

```bash
cd frontends/web
nvm install 18
nvm use 18
nvm install-latest-npm
npm install
echo 'REACT_APP_API_HOST = "https://localhost:8081"' >> .env
npm start
```

The frontend runs at `https://localhost:3000`.

### Sanity Checks
- DB: `mysql -h 127.0.0.1 -P 3306 -u dynabench -pdynabench -e "SELECT 1" dynabench`
- Legacy API (dev mode): open `https://localhost:8081/` in a browser
- Modern Backend: open `http://localhost:8000/docs` in a browser
- Frontend: open `https://localhost:3000` in a browser
