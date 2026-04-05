# Unix/macOS convenience wrapper — delegates to the cross-platform Python script.
# On Windows, run:  python sync_templates.py

.PHONY: sync-templates install-dev clean

sync-templates:
	python sync_templates.py

install-dev: sync-templates
	uv sync

clean:
	python sync_templates.py --clean

test:
	uv run pytest

test-cov:
	uv run pytest --cov-report=html
