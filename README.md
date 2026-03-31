# forge-cli

![Version](https://img.shields.io/badge/version-0.1.0-blue)
![Python](https://img.shields.io/badge/python-%3E%3D3.11-3776AB?logo=python&logoColor=white)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-windows%20%7C%20linux%20%7C%20macos-lightgrey)

A CLI tool that generates production-ready backends, frontends, or complete full-stack applications from Copier templates, wires services together with Docker Compose, and boots the system -- all from a single command.

```
$ forge

  +===================================+
  |             forge                  |
  |      Project Generator             |
  +===================================+

? Project name: acme
? Description: Acme e-commerce platform

  -- Backend (Python / FastAPI) --
? Backend server port: 5000
? Python version: 3.13

  -- Frontend --
? Frontend framework: Vue 3
? Author name: Jane Doe
? CRUD entities to generate: products, orders, customers
? Package manager: pnpm
? Frontend server port: 5173
? Enable Keycloak authentication? Yes
? Enable AI chat panel? No
? Enable OpenAPI code generation? No
? Default color scheme: indigo

  -- Keycloak --
? Keycloak host port: 8080
? Keycloak realm: master
? Keycloak client ID: acme

  -- Summary --
  Project:    acme
  Backend:    Python 3.13 on port 5000
  Frontend:   Vue 3 on port 5173
  Features:   products, orders, customers
  Auth:       Keycloak
  Keycloak:   port 8080, realm 'master'

? Proceed with generation? Yes

  Generating backend ...
  Generating vue frontend ...
  Rendering docker-compose.yml ...
  Rendering frontend Dockerfile ...
  Initializing git repository ...

  Project generated at: /home/dev/acme
? Start Docker Compose stack? Yes
```

---

## Description

Starting a new project means wiring together a backend, a frontend, a database, an identity provider, and the Docker glue that connects them. Doing this by hand for each new service is slow, error-prone, and inconsistent across teams.

**forge-cli** bundles four Copier templates into a single interactive CLI. You choose what you need -- a backend, a frontend, or both -- and it generates production-ready code with CRUD scaffolding, renders a `docker-compose.yml` that links only the services you selected, and optionally boots the stack in one step.

### What you can generate

```
Backend only                 Frontend only              Full stack
(Python/FastAPI + DB)        (Vue, Svelte, or Flutter)  (Backend + Frontend + DB)

+-------------+              +-------------+            +-------------+
|  backend    |              |  frontend   |            |  frontend   |
|  :5000      |              |  :5173      |            |  :5173      |
+------+------+              +-------------+            +------+------+
       |                                                       |
+------v------+                                         +------v------+     +-------------+
|  postgres   |                                         |  backend    +---->|  postgres   |
|  :5432      |                                         |  :5000      |     |  :5432      |
+-------------+                                         +------+------+     +-------------+
                                                               |
+-------------+                                         +------v------+
|  keycloak   |  (optional)                             |  keycloak   |  (optional)
|  :8080      |                                         |  :8080      |
+-------------+                                         +-------------+
```

---

## Features

- **Flexible generation** -- produce a backend only, a frontend only, or a complete full-stack application with a single command.
- **Four templates** -- Python/FastAPI backend, Vue 3, Svelte 5, and Flutter frontends, all bundled and version-controlled inside the package.
- **Full CRUD generation** -- each entity (e.g., `products`, `orders`) produces a complete vertical: domain model, ORM model, repository, service, REST endpoints, API client, UI pages, and tests.
- **Unified Docker Compose** -- a single `docker-compose.yml` is rendered at the project root, including only the services you selected.
- **One-command boot** -- optionally runs `docker compose up --build` after generation, with graceful cleanup on failure or `Ctrl+C`.
- **Keycloak integration** -- toggle authentication on and the CLI provisions a Keycloak dev container, configures JWT auth on the backend, and injects route guards on the frontend.
- **Port conflict detection** -- validates that no two services share a host port before generation begins.
- **Cross-platform** -- runs on Windows, Linux, and macOS with consistent behavior.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **CLI** | Python 3.11+, [Questionary](https://github.com/tmbo/questionary), [Copier](https://github.com/copier-org/copier), [Jinja2](https://github.com/pallets/jinja) |
| **Backend template** | FastAPI, SQLAlchemy, Alembic, Pydantic, Dishka (DI), uv |
| **Vue template** | Vue 3, Vite, TanStack Query, Zod, Vue Router |
| **Svelte template** | SvelteKit, Vite, OpenAPI TypeScript |
| **Flutter template** | Flutter, Dart, Riverpod |
| **Infrastructure** | Docker Compose, PostgreSQL 16, Keycloak 26, pgAdmin 4 |

---

## Getting Started

### Prerequisites

| Requirement | Purpose |
|---|---|
| **uv** | Package manager, Python toolchain -- the installer handles this automatically |
| **Git** | Initializes the generated project repository |
| **Docker & Docker Compose** | Builds and runs the service stack |
| **Node.js 22+** | Installs frontend dependencies (Vue/Svelte, called by the template hook) |
| **Flutter SDK** | Only if generating a Flutter frontend |

### Quick Install

The recommended way to install. The script checks for missing prerequisites (`uv`, `git`, `docker`), asks permission before installing each one, then installs forge-cli globally.

**Linux / macOS:**

```bash
curl -fsSL https://raw.githubusercontent.com/your-org/platform/main/forge-cli/scripts/install.sh | bash
```

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/your-org/platform/main/forge-cli/scripts/install.ps1 | iex
```

After installation, run `forge` from anywhere.

### Manual Installation

If you already have `uv` installed and prefer to skip the guided setup:

**Global install**

```bash
uv tool install git+https://github.com/your-org/platform.git#subdirectory=forge-cli
```

**One-shot execution (CI/CD and AI agents)**

```bash
uvx --from git+https://github.com/your-org/platform.git#subdirectory=forge-cli forge
```

**Development install**

```bash
git clone https://github.com/your-org/platform.git
cd platform/forge-cli
python sync_templates.py
uv sync
uv run forge
```

---

## Usage

### Basic workflow

```bash
forge
```

The CLI walks through the following prompts in order:

**1. Project basics**

```
? Project name: my-shop
? Description: An e-commerce platform
```

**2. Backend configuration**

```
  -- Backend (Python / FastAPI) --
? Backend server port: 5000
? Python version: 3.13
```

**3. Frontend selection**

Select `None` to generate a backend-only project.

```
  -- Frontend --
? Frontend framework: Vue 3
? Author name: Jane Doe
? CRUD entities to generate (comma-separated): products, orders, customers
? Package manager: pnpm
? Frontend server port: 5173
? Enable Keycloak authentication? Yes
? Enable AI chat panel? No
? Enable OpenAPI code generation? No
? Default color scheme: indigo
```

**4. Keycloak (if auth was enabled)**

```
  -- Keycloak --
? Keycloak host port: 8080
? Keycloak realm: master
? Keycloak client ID: my-shop
```

**5. Confirmation and generation**

```
  -- Summary --
  Project:    my-shop
  Backend:    Python 3.13 on port 5000
  Frontend:   Vue 3 on port 5173
  Features:   products, orders, customers
  Auth:       Keycloak
  Keycloak:   port 8080, realm 'master'

? Proceed with generation? Yes
? Start Docker Compose stack? Yes
```

### Managing the generated stack

```bash
cd my_shop/

# Start all services
docker compose up --build

# Start with pgAdmin included
docker compose --profile tools up --build

# Stop and clean up
docker compose down --volumes --remove-orphans
```

### Default service credentials

| Service | Username | Password |
|---|---|---|
| PostgreSQL | `postgres` | `postgres` |
| Keycloak admin | `admin` | `admin` |
| pgAdmin | `admin@localhost.com` | `admin` |

### Default port assignments

| Service | Port |
|---|---|
| Backend (FastAPI) | `5000` |
| Frontend (Vite dev server) | `5173` |
| PostgreSQL | `5432` |
| pgAdmin | `5050` |
| Keycloak | `8080` |

---

## Configuration Reference

### Frontend frameworks

| Choice | Template | Slug format | Package managers |
|---|---|---|---|
| Vue 3 | `vue-frontend-template` | kebab-case | npm, pnpm, yarn |
| Svelte 5 | `svelte-frontend-template` | kebab-case | npm, pnpm, bun |
| Flutter | `flutter-frontend-template` | snake_case | N/A |
| None | -- | -- | -- |

### Feature toggles

| Toggle | Scope | Default | Effect |
|---|---|---|---|
| Keycloak authentication | Frontend | Yes | JWT auth, Keycloak container, route guards |
| AI chat panel | Frontend | No | Chat panel component |
| OpenAPI code generation | Vue / Flutter | No | Generated API client from OpenAPI spec |

### Entity naming rules

Entity names provided in the `features` prompt must:

- Be lowercase, starting with a letter: `^[a-z][a-z0-9_]*$`
- Not be Python keywords (`class`, `def`, `import`, etc.)
- Not duplicate another entity in the list
- Not use a reserved name:

| Frontend reserved |
|---|
| auth, home, profile, settings, chat, core, shared, shell, dashboard, tasks, app, test, lib, routes, api |

### What each entity generates

**Backend** -- 7 files per entity:

| File | Path |
|---|---|
| Domain model | `src/{package}/domain/{entity}.py` |
| ORM model | `src/{package}/data/models/{entity}.py` |
| Repository | `src/{package}/data/repositories/{entity}_repository.py` |
| Service | `src/{package}/services/{entity}_service.py` |
| REST endpoints | `src/{package}/api/v1/endpoints/{entities}.py` |
| Unit tests | `tests/unit/test_{entity}_service.py` |
| Integration tests | `tests/integration/test_{entities}_api.py` |

**Vue frontend** -- 8 files per entity:

| File | Path |
|---|---|
| Vue Query composable | `src/features/{entities}/api/use{Entities}.ts` |
| Zod schema | `src/features/{entities}/model/{entity}.schema.ts` |
| Schema tests | `src/features/{entities}/model/{entity}.schema.test.ts` |
| List page | `src/features/{entities}/ui/{Entities}ListPage.vue` |
| Create page | `src/features/{entities}/ui/{Entity}CreatePage.vue` |
| Detail page | `src/features/{entities}/ui/{Entity}DetailPage.vue` |
| Barrel export | `src/features/{entities}/index.ts` |
| MSW mock handlers | `src/shared/mocks/{entities}.handlers.ts` |

Svelte and Flutter templates generate analogous files in their respective framework conventions.

---

## Docker Compose Architecture

When generation completes, a `docker-compose.yml` is rendered at the project root containing only the services you selected:

```
+-------------+     +-------------+     +-------------+
|  frontend   |---->|  backend    |---->|  postgres   |
|  :5173      |     |  :5000      |     |  :5432      |
+-------------+     +------+------+     +-------------+
                           |
                    +------v------+
                    |  keycloak   |  (if auth enabled)
                    |  :8080      |
                    +-------------+

                    +-------------+
                    |  pgadmin    |  (tools profile, opt-in)
                    |  :5050      |
                    +-------------+
```

All services communicate over a shared `app-network` bridge network. The frontend Vite dev server proxies `/api` requests to the backend container via Docker DNS (`http://backend:{port}`).

**Flutter exception**: Flutter is a native mobile/desktop framework and cannot be Dockerized for development. When Flutter is selected, the project is generated but excluded from Docker Compose. Run it natively with `flutter run`.

---

## Project Structure

```
forge-cli/
├── pyproject.toml              # Package metadata, dependencies, entry point
├── MANIFEST.in                 # Ensures templates are included in sdist
├── Makefile                    # Unix convenience wrapper for sync_templates.py
├── sync_templates.py           # Cross-platform template sync script
├── scripts/
│   ├── install.sh              # One-command installer (Linux/macOS)
│   └── install.ps1             # One-command installer (Windows)
│
├── forge/
│   ├── __init__.py             # Package version (0.1.0)
│   ├── __main__.py             # Enables `uv run forge`
│   ├── cli.py                  # Interactive prompts and entry point
│   ├── config.py               # Dataclasses, enums, validation logic
│   ├── variable_mapper.py      # Translates config into per-template data dicts
│   ├── generator.py            # Copier orchestration pipeline
│   ├── docker_manager.py       # Compose/Dockerfile rendering and Docker lifecycle
│   │
│   └── templates/
│       ├── docker-compose.yml.j2       # Jinja2 master compose template
│       ├── Dockerfile.node.j2          # Jinja2 Node.js dev Dockerfile (Vue/Svelte)
│       ├── python-service-template/    # Bundled backend Copier template
│       ├── vue-frontend-template/      # Bundled Vue Copier template
│       ├── svelte-frontend-template/   # Bundled Svelte Copier template
│       └── flutter-frontend-template/  # Bundled Flutter Copier template
│
└── tests/
    ├── test_config.py              # Validation, ports, slugs, reserved names
    ├── test_variable_mapper.py     # Variable mapping for all four frameworks
    └── test_docker_manager.py      # Compose YAML rendering, Dockerfile generation
```

### Generated output structure

A fully configured project (backend + Vue + Keycloak) produces:

```
acme/                           # Project root (derived from project name)
├── docker-compose.yml
├── .git/
│
├── backend/                    # Python / FastAPI service
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── alembic.ini
│   ├── alembic/
│   ├── config/
│   ├── src/
│   │   ├── service/            # Shared infrastructure
│   │   └── backend/            # Application code (Python package)
│   │       ├── api/v1/
│   │       ├── data/models/
│   │       ├── data/repositories/
│   │       ├── domain/
│   │       └── services/
│   └── tests/
│
└── frontend/                   # Vue 3 / Svelte 5 application
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── app/
        ├── features/
        └── shared/
```

---

## Template Syncing

The four Copier templates are bundled inside the `forge` package. To update them from the parent repository:

```bash
# Cross-platform (Windows, Linux, macOS)
python sync_templates.py

# Remove synced templates and build artifacts
python sync_templates.py --clean

# Unix/macOS shorthand
make sync-templates
```

---

## Updating

```bash
uv tool upgrade forge-cli
```

---

## Development

### Running tests

```bash
cd forge-cli
uv run pytest -v
```

### Dependencies

| Package | Version | Purpose |
|---|---|---|
| `copier` | >= 9.0.0 | Template rendering engine |
| `questionary` | >= 2.0.0 | Interactive terminal prompts |
| `jinja2` | >= 3.1.0 | Docker Compose and Dockerfile rendering |
| `pytest` | >= 8.0 | Test runner (dev) |
| `pyyaml` | >= 6.0 | YAML assertion in tests (dev) |

---

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feat/my-feature`.
3. Make your changes and ensure all tests pass: `uv run pytest -v`.
4. Commit with a clear message describing the change.
5. Open a pull request against `main`.

---

## License

This project is licensed under the [MIT License](LICENSE).
