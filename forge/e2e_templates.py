"""Playwright e2e test templates for co-generated browser tests."""

from __future__ import annotations


CONFTEST_TEMPLATE = """\
\"\"\"Playwright e2e test fixtures.\"\"\"

import os

import pytest
from playwright.async_api import async_playwright


BASE_URL = os.environ.get("BASE_URL", "http://localhost:5173")


@pytest.fixture(scope="session")
async def browser():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        yield browser
        await browser.close()


@pytest.fixture
async def page(browser):
    context = await browser.new_context(
        viewport={{"width": 1280, "height": 720}},
    )
    page = await context.new_page()
    yield page
    await context.close()
"""


E2E_TEST_TEMPLATE = """\
\"\"\"End-to-end Playwright tests for {plural} feature.\"\"\"

import os
import re

import pytest
from playwright.async_api import Page, expect


BASE_URL = os.environ.get("BASE_URL", "http://localhost:5173")


class Test{Plural}List:
    async def test_list_page_loads(self, page: Page):
        await page.goto(f"{{BASE_URL}}/{plural}")
        await expect(page.locator("[data-test='{plural}-list']")).to_be_visible()

    async def test_create_button_visible(self, page: Page):
        await page.goto(f"{{BASE_URL}}/{plural}")
        await expect(page.locator("[data-test='{plural}-create-btn']")).to_be_visible()

    async def test_search_input_exists(self, page: Page):
        await page.goto(f"{{BASE_URL}}/{plural}")
        await expect(page.locator("[data-test='{plural}-search-input']")).to_be_visible()


class Test{Singular}Create:
    async def test_create_form_loads(self, page: Page):
        await page.goto(f"{{BASE_URL}}/{plural}/new")
        await expect(page.locator("[data-test='{singular}-name-input']")).to_be_visible()
        await expect(page.locator("[data-test='{singular}-submit-btn']")).to_be_visible()

    async def test_create_flow(self, page: Page):
        await page.goto(f"{{BASE_URL}}/{plural}/new")
        await page.fill("[data-test='{singular}-name-input']", "Test {Singular}")
        await page.fill("[data-test='{singular}-description-input']", "Test description")
        await page.click("[data-test='{singular}-submit-btn']")
        await expect(page).to_have_url(re.compile(r"/{plural}/[a-f0-9-]+"))


class Test{Singular}Detail:
    async def test_navigation_to_detail(self, page: Page):
        await page.goto(f"{{BASE_URL}}/{plural}")
        first_card = page.locator("[data-test='{singular}-card']").first
        await first_card.click()
        await expect(page.locator("[data-test='{singular}-detail']")).to_be_visible()
"""


def generate_e2e_conftest() -> str:
    return CONFTEST_TEMPLATE


def generate_e2e_test(feature_context: dict[str, str]) -> str:
    return E2E_TEST_TEMPLATE.format(**feature_context)
