"""Tests that verify coverage.py integration is configured correctly."""

import tomllib
from pathlib import Path

import pytest

PYPROJECT = Path(__file__).resolve().parent.parent / "pyproject.toml"


class TestCoverageConfig:
    """Verify pyproject.toml contains valid coverage configuration."""

    @pytest.fixture(scope="class")
    def pyproject(self):
        return tomllib.loads(PYPROJECT.read_text(encoding="utf-8"))

    def test_pytest_cov_in_dev_dependencies(self, pyproject):
        dev_deps = pyproject["dependency-groups"]["dev"]
        assert any("pytest-cov" in dep for dep in dev_deps)

    def test_coverage_run_section_exists(self, pyproject):
        assert "coverage" in pyproject["tool"]
        assert "run" in pyproject["tool"]["coverage"]

    def test_coverage_source_is_forge(self, pyproject):
        source = pyproject["tool"]["coverage"]["run"]["source"]
        assert "forge" in source

    def test_templates_omitted_from_coverage(self, pyproject):
        omit = pyproject["tool"]["coverage"]["run"]["omit"]
        assert any("templates" in pattern for pattern in omit)

    def test_coverage_report_has_fail_under(self, pyproject):
        report = pyproject["tool"]["coverage"]["report"]
        assert "fail_under" in report
        assert isinstance(report["fail_under"], (int, float))
        assert report["fail_under"] > 0

    def test_coverage_report_show_missing(self, pyproject):
        report = pyproject["tool"]["coverage"]["report"]
        assert report.get("show_missing") is True
