"""Copier orchestration -- generates all project components."""

from __future__ import annotations

import os
import shutil
import stat
import subprocess
from pathlib import Path

from copier import run_copy

from forge import variable_mapper
from forge.config import FrontendFramework, ProjectConfig
from forge.docker_manager import render_compose, render_frontend_dockerfile

TEMPLATES_DIR = Path(__file__).parent / "templates"

TEMPLATE_DIRS = {
    "backend": "python-service-template",
    FrontendFramework.VUE: "vue-frontend-template",
    FrontendFramework.SVELTE: "svelte-frontend-template",
    FrontendFramework.FLUTTER: "flutter-frontend-template",
}


def generate(config: ProjectConfig) -> Path:
    """Generate all project components and return the project root path."""
    project_root = Path(config.output_dir).resolve() / config.project_slug
    project_root.mkdir(parents=True, exist_ok=True)

    # 1. Generate backend
    if config.backend:
        print("  Generating backend ...")
        _generate_backend(config, project_root)

    # 2. Generate frontend
    if config.frontend and config.frontend.framework != FrontendFramework.NONE:
        print(f"  Generating {config.frontend.framework.value} frontend ...")
        _generate_frontend(config, project_root)

    # 3. Render Docker Compose (Vue/Svelte get full Docker; Flutter excluded)
    if config.backend:
        print("  Rendering docker-compose.yml ...")
        render_compose(config, project_root)

    # 4. Render frontend Dockerfile (Vue/Svelte only)
    if config.frontend and config.frontend.framework in (
        FrontendFramework.VUE,
        FrontendFramework.SVELTE,
    ):
        print("  Rendering frontend Dockerfile ...")
        frontend_dir = project_root / config.frontend_slug
        render_frontend_dockerfile(config, frontend_dir)

    # 5. Post-process: patch Svelte vite proxy for Docker networking
    if config.frontend and config.frontend.framework == FrontendFramework.SVELTE:
        _patch_svelte_proxy(config, project_root)

    # 6. Clean up per-template .git repos and create unified one
    print("  Initializing git repository ...")
    _cleanup_sub_git_repos(project_root)
    _git_init(project_root)

    # 7. Notify about Flutter
    if config.frontend and config.frontend.framework == FrontendFramework.FLUTTER:
        print()
        print(
            f"  Note: Flutter frontend generated at ./{config.frontend_slug}. "
            "Run it natively with `flutter run`. "
            "It is not included in Docker Compose."
        )

    return project_root


def _generate_backend(config: ProjectConfig, project_root: Path) -> Path:
    """Generate backend using Copier (_subdirectory: template)."""
    ctx = variable_mapper.backend_context(config)
    dst = project_root / config.backend_slug
    dst.mkdir(exist_ok=True)
    run_copy(
        src_path=str(TEMPLATES_DIR / TEMPLATE_DIRS["backend"]),
        dst_path=str(dst),
        data=ctx,
        unsafe=True,
        defaults=True,
        overwrite=True,
    )
    return dst


def _generate_frontend(config: ProjectConfig, project_root: Path) -> Path:
    """Generate frontend using Copier."""
    fw = config.frontend.framework
    template_dir = TEMPLATE_DIRS.get(fw)
    if template_dir is None:
        raise ValueError(f"No template for framework: {fw}")

    ctx = variable_mapper.frontend_context(config)

    if fw == FrontendFramework.FLUTTER:
        # Flutter template has no _subdirectory; it creates {{project_slug}}/
        # inside dst_path, so pass the project root directly.
        run_copy(
            src_path=str(TEMPLATES_DIR / template_dir),
            dst_path=str(project_root),
            data=ctx,
            unsafe=True,
            defaults=True,
            overwrite=True,
        )
    else:
        # Vue/Svelte use _subdirectory: template, generating INTO dst_path.
        dst = project_root / config.frontend_slug
        dst.mkdir(exist_ok=True)
        run_copy(
            src_path=str(TEMPLATES_DIR / template_dir),
            dst_path=str(dst),
            data=ctx,
            unsafe=True,
            defaults=True,
            overwrite=True,
        )

    return project_root / config.frontend_slug


def _patch_svelte_proxy(config: ProjectConfig, project_root: Path) -> None:
    """Svelte's vite.config.ts hardcodes the proxy target. Patch it for Docker."""
    if config.backend is None:
        return
    vite_config = project_root / config.frontend_slug / "vite.config.ts"
    if not vite_config.exists():
        return
    content = vite_config.read_text(encoding="utf-8")
    docker_target = f"http://backend:{config.backend.server_port}"
    patched = content.replace(
        "target: 'http://localhost:5000'",
        f"target: '{docker_target}'",
    )
    if patched != content:
        vite_config.write_text(patched, encoding="utf-8")


def _force_remove_readonly(func, path, _exc_info):
    """Error handler for shutil.rmtree to clear read-only flags on Windows."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def _cleanup_sub_git_repos(project_root: Path) -> None:
    """Remove .git directories from generated subdirectories."""
    for child in project_root.iterdir():
        if child.is_dir():
            git_dir = child / ".git"
            if git_dir.exists():
                shutil.rmtree(git_dir, onerror=_force_remove_readonly)


def _git_init(project_root: Path) -> None:
    """Initialize a single git repo at the project root."""
    subprocess.run(
        ["git", "init"],
        cwd=str(project_root),
        capture_output=True,
    )
    subprocess.run(
        ["git", "add", "."],
        cwd=str(project_root),
        capture_output=True,
    )
    subprocess.run(
        ["git", "commit", "-m", "Initial commit from forge"],
        cwd=str(project_root),
        capture_output=True,
    )
