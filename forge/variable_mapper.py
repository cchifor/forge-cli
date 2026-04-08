"""Maps unified ProjectConfig into per-template Copier data dicts."""

from __future__ import annotations

from typing import Any

from forge.config import BackendConfig, FrontendFramework, ProjectConfig


def backend_context(bc: BackendConfig) -> dict[str, Any]:
    """Build data dict for the python-service-template (Copier)."""
    return {
        "project_name": bc.name,
        "project_description": bc.description,
        "server_port": bc.server_port,
        "db_name": bc.name.replace("-", "_"),
        "python_version": bc.python_version,
    }


def rust_backend_context(bc: BackendConfig) -> dict[str, Any]:
    """Build data dict for the rust-service-template (Copier)."""
    return {
        "project_name": bc.name,
        "project_description": bc.description,
        "server_port": bc.server_port,
        "db_name": bc.name.replace("-", "_"),
        "rust_edition": bc.rust_edition,
    }


def node_backend_context(bc: BackendConfig) -> dict[str, Any]:
    """Build data dict for the node-service-template (Copier)."""
    return {
        "project_name": bc.name,
        "project_description": bc.description,
        "server_port": bc.server_port,
        "db_name": bc.name.replace("-", "_"),
        "node_version": bc.node_version,
    }


def vue_context(config: ProjectConfig) -> dict[str, Any]:
    """Build data dict for the vue-frontend-template (Copier)."""
    fc = config.frontend
    if fc is None or fc.framework != FrontendFramework.VUE:
        raise ValueError("Vue frontend config is required.")
    bc = config.backend
    backend_port = bc.server_port if bc else 5000
    backend_name = bc.name if bc else "backend"
    return {
        "project_name": fc.project_name,
        "project_slug": config.frontend_slug,
        "description": fc.description,
        "features": ", ".join(fc.features),
        "author_name": fc.author_name,
        "version": fc.version,
        "package_manager": fc.package_manager,
        "include_auth": fc.include_auth,
        "include_chat": fc.include_chat,
        "include_openapi": fc.include_openapi,
        "api_base_url": f"http://localhost:{fc.server_port}",
        "api_proxy_target": f"http://{backend_name}:{backend_port}",
        "server_port": fc.server_port,
        "keycloak_url": fc.keycloak_url,
        "keycloak_realm": fc.keycloak_realm,
        "keycloak_client_id": fc.keycloak_client_id or config.frontend_slug,
        "default_color_scheme": fc.default_color_scheme,
    }


def svelte_context(config: ProjectConfig) -> dict[str, Any]:
    """Build data dict for the svelte-frontend-template (Copier)."""
    fc = config.frontend
    if fc is None or fc.framework != FrontendFramework.SVELTE:
        raise ValueError("Svelte frontend config is required.")
    bc = config.backend
    backend_port = bc.server_port if bc else 5000
    backend_name = bc.name if bc else "backend"
    return {
        "project_name": fc.project_name,
        "project_slug": config.frontend_slug,
        "description": fc.description,
        "features": ", ".join(fc.features),
        "author_name": fc.author_name,
        "version": fc.version,
        "include_auth": fc.include_auth,
        "include_chat": fc.include_chat,
        "package_manager": fc.package_manager,
        "api_base_url": f"http://{backend_name}:{backend_port}",
        "server_port": fc.server_port,
        "keycloak_url": fc.keycloak_url,
        "keycloak_realm": fc.keycloak_realm,
        "keycloak_client_id": fc.keycloak_client_id or config.frontend_slug,
    }


def flutter_context(config: ProjectConfig) -> dict[str, Any]:
    """Build data dict for the flutter-frontend-template (Copier)."""
    fc = config.frontend
    if fc is None or fc.framework != FrontendFramework.FLUTTER:
        raise ValueError("Flutter frontend config is required.")
    bc = config.backend
    backend_port = bc.server_port if bc else 5000
    return {
        "project_name": fc.project_name,
        "project_slug": config.frontend_slug,
        "org_name": fc.org_name,
        "description": fc.description,
        "features": ", ".join(fc.features),
        "version": fc.version,
        "include_auth": fc.include_auth,
        "include_chat": fc.include_chat,
        "include_openapi": fc.include_openapi,
        "api_base_url": f"http://localhost:{backend_port}",
        "server_port": str(backend_port),
        "keycloak_url": fc.keycloak_url,
        "keycloak_realm": fc.keycloak_realm,
        "keycloak_client_id": fc.keycloak_client_id or config.frontend_slug,
        "author_name": fc.author_name,
    }


def frontend_context(config: ProjectConfig) -> dict[str, Any]:
    """Dispatch to the correct frontend mapper."""
    if config.frontend is None:
        raise ValueError("No frontend configured.")
    mapping = {
        FrontendFramework.VUE: vue_context,
        FrontendFramework.SVELTE: svelte_context,
        FrontendFramework.FLUTTER: flutter_context,
    }
    fn = mapping.get(config.frontend.framework)
    if fn is None:
        raise ValueError(f"No mapper for {config.frontend.framework}")
    return fn(config)
