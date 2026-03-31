"""Docker Compose rendering and lifecycle management."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from forge.config import FrontendFramework, ProjectConfig

TEMPLATES_DIR = Path(__file__).parent / "templates"


# ── Rendering ───────────────────────────────────────────────────────────────

def _jinja_env() -> Environment:
    return Environment(
        loader=FileSystemLoader(str(TEMPLATES_DIR)),
        keep_trailing_newline=True,
        trim_blocks=True,
        lstrip_blocks=True,
    )


def render_compose(config: ProjectConfig, project_root: Path) -> Path:
    """Render docker-compose.yml into the project root."""
    env = _jinja_env()
    template = env.get_template("docker-compose.yml.j2")

    has_frontend = (
        config.frontend is not None
        and config.frontend.framework in (FrontendFramework.VUE, FrontendFramework.SVELTE)
    )

    context = {
        "backend_slug": config.backend_slug,
        "backend_port": config.backend.server_port if config.backend else 5000,
        "db_name": config.backend_slug,
        "has_frontend": has_frontend,
        "frontend_slug": config.frontend_slug if has_frontend else "",
        "frontend_port": (
            config.frontend.server_port if config.frontend and has_frontend else 5173
        ),
        "include_keycloak": config.include_keycloak,
        "keycloak_port": config.keycloak_port,
        "keycloak_realm": (
            config.frontend.keycloak_realm
            if config.frontend and config.include_keycloak
            else "master"
        ),
        "keycloak_client_id": (
            config.frontend.keycloak_client_id
            if config.frontend and config.include_keycloak
            else config.frontend_slug
        ),
    }

    output = template.render(context)
    compose_path = project_root / "docker-compose.yml"
    compose_path.write_text(output, encoding="utf-8")
    return compose_path


def render_frontend_dockerfile(config: ProjectConfig, frontend_dir: Path) -> Path:
    """Render a Node.js dev Dockerfile into the frontend directory."""
    env = _jinja_env()
    template = env.get_template("Dockerfile.node.j2")

    fc = config.frontend
    context = {
        "package_manager": fc.package_manager if fc else "npm",
        "server_port": fc.server_port if fc else 5173,
    }

    output = template.render(context)
    dockerfile_path = frontend_dir / "Dockerfile"
    dockerfile_path.write_text(output, encoding="utf-8")
    return dockerfile_path


# ── Lifecycle ───────────────────────────────────────────────────────────────

def boot(project_root: Path) -> None:
    """Run docker compose up --build with error handling."""
    compose_file = project_root / "docker-compose.yml"
    if not compose_file.exists():
        print("  Error: docker-compose.yml not found.")
        return

    print("  Starting Docker Compose stack ...")
    print("  (Press Ctrl+C to stop)\n")
    try:
        subprocess.run(
            ["docker", "compose", "up", "--build"],
            cwd=str(project_root),
            check=True,
        )
    except subprocess.CalledProcessError:
        print("\n  Docker Compose failed. Cleaning up ...")
        teardown(project_root)
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n  Interrupted. Cleaning up ...")
        teardown(project_root)


def teardown(project_root: Path) -> None:
    """Run docker compose down to clean up containers."""
    subprocess.run(
        ["docker", "compose", "down", "--volumes", "--remove-orphans"],
        cwd=str(project_root),
        capture_output=True,
    )
    print("  Stack stopped and cleaned up.")
