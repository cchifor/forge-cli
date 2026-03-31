#!/usr/bin/env python3
"""Cross-platform script to sync templates into forge/templates/.

Usage:
    python sync_templates.py          # sync templates
    python sync_templates.py --clean  # remove synced templates + build artifacts
"""

from __future__ import annotations

import os
import shutil
import stat
import sys
from pathlib import Path

TEMPLATES = [
    "python-service-template",
    "vue-frontend-template",
    "svelte-frontend-template",
    "flutter-frontend-template",
]

EXCLUDE_DIRS = {"__pycache__", ".mypy_cache", ".git"}

SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
TEMPLATE_DEST = SCRIPT_DIR / "forge" / "templates"


def _force_remove_readonly(func, path, _exc_info):
    """Handle read-only files on Windows during rmtree."""
    os.chmod(path, stat.S_IWRITE)
    func(path)


def _copytree_filtered(src: Path, dst: Path) -> None:
    """Copy a directory tree, skipping excluded directories."""
    def _ignore(directory: str, contents: list[str]) -> set[str]:
        return {c for c in contents if c in EXCLUDE_DIRS}

    if dst.exists():
        shutil.rmtree(dst, onerror=_force_remove_readonly)
    shutil.copytree(src, dst, ignore=_ignore)


def sync() -> None:
    for name in TEMPLATES:
        src = REPO_ROOT / name
        dst = TEMPLATE_DEST / name
        if not src.is_dir():
            print(f"  Warning: {src} not found, skipping.")
            continue
        print(f"  Syncing {name} ...")
        _copytree_filtered(src, dst)
    print("  Templates synced.")


def clean() -> None:
    for name in TEMPLATES:
        dst = TEMPLATE_DEST / name
        if dst.exists():
            print(f"  Removing {name} ...")
            shutil.rmtree(dst, onerror=_force_remove_readonly)
    for artifact in ["build", "dist"]:
        p = SCRIPT_DIR / artifact
        if p.exists():
            shutil.rmtree(p, onerror=_force_remove_readonly)
    for egg in SCRIPT_DIR.glob("*.egg-info"):
        shutil.rmtree(egg, onerror=_force_remove_readonly)
    print("  Clean complete.")


if __name__ == "__main__":
    if "--clean" in sys.argv:
        clean()
    else:
        sync()
