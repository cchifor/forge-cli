"""Tests for e2e test template generation."""

from forge.e2e_templates import generate_e2e_conftest, generate_e2e_test


def test_generate_conftest():
    output = generate_e2e_conftest()
    assert "async_playwright" in output
    assert "BASE_URL" in output
    assert "@pytest.fixture" in output


def test_generate_e2e_test():
    ctx = {
        "plural": "items",
        "singular": "item",
        "Plural": "Items",
        "Singular": "Item",
        "PLURAL": "ITEMS",
    }
    output = generate_e2e_test(ctx)
    assert "TestItemsList" in output
    assert "TestItemCreate" in output
    assert "TestItemDetail" in output
    assert "data-test='items-list'" in output
    assert "data-test='item-name-input'" in output
    assert "data-test='item-submit-btn'" in output
