"""Tests for forge.docker_manager compose rendering."""

import yaml
import pytest

from forge.config import (
    BackendConfig,
    FrontendConfig,
    FrontendFramework,
    ProjectConfig,
)
from forge.docker_manager import render_compose, render_frontend_dockerfile


def _make_config(
    framework=FrontendFramework.VUE,
    include_keycloak=False,
    has_frontend=True,
):
    bc = BackendConfig(project_name="Test App", server_port=5000)
    fc = None
    if has_frontend:
        fc = FrontendConfig(
            framework=framework,
            project_name="Test App",
            server_port=5173,
            keycloak_url="http://localhost:8080",
            keycloak_realm="master",
            keycloak_client_id="test-app",
        )
    return ProjectConfig(
        project_name="Test App",
        backend=bc,
        frontend=fc,
        include_keycloak=include_keycloak,
        keycloak_port=8080,
    )


class TestRenderCompose:
    def test_backend_only(self, tmp_path):
        config = _make_config(has_frontend=False)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert "backend" in data["services"]
        assert "postgres" in data["services"]
        assert "frontend" not in data["services"]
        assert "keycloak" not in data["services"]

    def test_backend_with_vue(self, tmp_path):
        config = _make_config(framework=FrontendFramework.VUE)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert "backend" in data["services"]
        assert "frontend" in data["services"]
        assert data["services"]["frontend"]["ports"] == ["5173:5173"]

    def test_flutter_excluded_from_compose(self, tmp_path):
        config = _make_config(framework=FrontendFramework.FLUTTER)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert "frontend" not in data["services"]

    def test_keycloak_included(self, tmp_path):
        config = _make_config(include_keycloak=True)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert "keycloak" in data["services"]
        assert data["services"]["keycloak"]["ports"] == ["8080:8080"]
        # Backend should reference keycloak
        env = data["services"]["backend"]["environment"]
        assert env["APP__SECURITY__AUTH__ENABLED"] == "true"
        assert env["APP__SECURITY__AUTH__SERVER_URL"] == "http://keycloak:8080"

    def test_keycloak_excluded(self, tmp_path):
        config = _make_config(include_keycloak=False)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert "keycloak" not in data["services"]
        env = data["services"]["backend"]["environment"]
        assert env["APP__SECURITY__AUTH__ENABLED"] == "false"

    def test_pgadmin_in_tools_profile(self, tmp_path):
        config = _make_config(has_frontend=False)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        pgadmin = data["services"]["pgadmin"]
        assert pgadmin["profiles"] == ["tools"]

    def test_network_defined(self, tmp_path):
        config = _make_config(has_frontend=False)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert "app-network" in data["networks"]

    def test_backend_ports(self, tmp_path):
        config = _make_config(has_frontend=False)
        config.backend.server_port = 8000
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        assert data["services"]["backend"]["ports"] == ["8000:8000"]

    def test_postgres_healthcheck(self, tmp_path):
        config = _make_config(has_frontend=False)
        compose_path = render_compose(config, tmp_path)
        data = yaml.safe_load(compose_path.read_text(encoding="utf-8"))

        pg = data["services"]["postgres"]
        assert "healthcheck" in pg
        assert pg["healthcheck"]["retries"] == 5


class TestRenderFrontendDockerfile:
    def test_npm_dockerfile(self, tmp_path):
        config = _make_config(framework=FrontendFramework.VUE)
        config.frontend.package_manager = "npm"
        path = render_frontend_dockerfile(config, tmp_path)
        content = path.read_text(encoding="utf-8")

        assert "FROM node:22-slim" in content
        assert "package-lock.json" in content
        assert "npm install" in content
        assert "npm" in content
        assert "EXPOSE 5173" in content

    def test_pnpm_dockerfile(self, tmp_path):
        config = _make_config(framework=FrontendFramework.SVELTE)
        config.frontend.package_manager = "pnpm"
        path = render_frontend_dockerfile(config, tmp_path)
        content = path.read_text(encoding="utf-8")

        assert "corepack enable" in content
        assert "pnpm-lock.yaml" in content
        assert "pnpm install" in content

    def test_bun_dockerfile(self, tmp_path):
        config = _make_config(framework=FrontendFramework.SVELTE)
        config.frontend.package_manager = "bun"
        path = render_frontend_dockerfile(config, tmp_path)
        content = path.read_text(encoding="utf-8")

        assert "npm install -g bun" in content
        assert "bun.lockb" in content
        assert "bun install" in content

    def test_yarn_dockerfile(self, tmp_path):
        config = _make_config(framework=FrontendFramework.VUE)
        config.frontend.package_manager = "yarn"
        path = render_frontend_dockerfile(config, tmp_path)
        content = path.read_text(encoding="utf-8")

        assert "corepack enable" in content
        assert "yarn.lock" in content
        assert "yarn install" in content
