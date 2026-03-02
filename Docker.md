# Docker Setup for theMenu

This repository is configured to run the Laravel backend and the React frontend inside Docker containers. The following notes will help teammates build, run, and develop using Docker.

## Prerequisites

- Docker Engine (compatible with Compose v2)
- Git
- No need to install PHP/MySQL/Node locally; everything lives in containers.

> On Windows you can use Docker Desktop; ensure it’s running before continuing.

## Building the containers

From the project root (`d:\ACADEMICS\SD\theMenu`):

```powershell
# rebuild both services (app and db) using the Dockerfile in the repo
docker compose up --build
docker compose up --build -d   # detached mode
```

The first time the build may take several minutes. Subsequent starts reuse cached layers.

## Services overview

- **app**: PHP 8.2 + Apache image. It compiles the React frontend using Node 22.18.0, installs Composer dependencies, and uses the `server/` directory as the Laravel application root. Exposes port 80 which is mapped to `localhost:8000` by default.
- **db**: MySQL 8.0 container with initial database `themenu`. Credentials are declared in `docker-compose.yml` (`themenu_user` / `secret`). Data is stored in a named volume `db_data`.

## Environment variables

The build args and runtime environment variables in `docker-compose.yml` are already set to reasonable defaults (see file). You can override values by editing `docker-compose.yml` or by passing `-e` flags to `docker compose run`.

Important variables:

- `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`
- Laravel-specific variables such as `APP_ENV`, `APP_DEBUG`, `APP_URL`, etc.

## Development workflow

1. **Start containers**
   ```powershell
   docker compose up -d --build
   ```

2. **Run artisan commands**
   ```powershell
   docker compose exec app bash
   php artisan migrate --seed
   php artisan tinker
   exit
   ```

3. **Frontend changes**
   - Edit files under `client/src/` on the host; the `app` service only copies the built output during build. For hot-reload, run the Vite dev server locally or create a separate container.
   - To rebuild the production bundle, either restart the `app` service (`docker compose up --build app`) or run:
     ```powershell
     docker compose exec app bash
     cd client
     npm ci && npm run build
     exit
     ```

4. **Database persistence**
   - The `db_data` volume keeps MySQL data between restarts. To start fresh:
     ```powershell
     docker compose down -v
     docker compose up --build
     ```

## Useful commands

```powershell
# stop everything
docker compose down

# view logs
docker compose logs -f

# run artisan in one-off container
docker compose run --rm app php artisan migrate
```

## Troubleshooting

- If the frontend fails to build during the Docker build, run `npm run build` inside `client` on your host to see errors (TS uses strict rules, remove unused imports, etc.).
- To access the database from your local machine use `localhost:3306` with the same credentials.
- Make sure Docker has sufficient memory (at least 4 GB) and that file sharing is enabled for your project directory.

---

Feel free to extend this document with any project-specific notes.