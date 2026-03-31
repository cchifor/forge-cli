#!/usr/bin/env bash
set -euo pipefail

REPO="https://github.com/your-org/platform.git"
TOOL="git+${REPO}#subdirectory=forge-cli"

ask() { read -rp "$1 [Y/n] " a; [[ "${a:-Y}" =~ ^[Yy]$ ]]; }

echo ""
echo "  +===================================+"
echo "  |     forge installer          |"
echo "  +===================================+"
echo ""
echo "  Checking prerequisites..."
echo ""

# --- uv (REQUIRED) ---
if command -v uv &>/dev/null; then
    echo "  [ok] uv $(uv --version)"
else
    echo "  [--] uv is not installed (required)"
    if ask "  Install uv now?"; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        source "$HOME/.local/bin/env" 2>/dev/null || export PATH="$HOME/.local/bin:$PATH"
        echo "  [ok] uv installed"
    else
        echo "  [!!] Cannot continue without uv. Aborting."
        exit 1
    fi
fi

# --- git (recommended) ---
if command -v git &>/dev/null; then
    echo "  [ok] git $(git --version | cut -d' ' -f3)"
else
    echo "  [--] git is not installed (needed for project generation)"
    if ask "  Install git now?"; then
        if [[ "$(uname)" == "Darwin" ]]; then
            xcode-select --install 2>/dev/null || echo "  Xcode CLT install triggered -- re-run this script after it completes."
            exit 0
        elif command -v apt-get &>/dev/null; then
            sudo apt-get update -qq && sudo apt-get install -y -qq git
        elif command -v dnf &>/dev/null; then
            sudo dnf install -y git
        elif command -v pacman &>/dev/null; then
            sudo pacman -Sy --noconfirm git
        else
            echo "  [!!] Could not detect package manager. Install git manually."
        fi
    else
        echo "  [!!] Skipping git -- you will need it later for project generation"
    fi
fi

# --- docker (recommended) ---
if command -v docker &>/dev/null; then
    echo "  [ok] docker $(docker --version | cut -d' ' -f3 | tr -d ',')"
else
    echo "  [--] docker is not installed (needed to run the generated stack)"
    if ask "  Install Docker now?"; then
        if [[ "$(uname)" == "Darwin" ]]; then
            echo "  Please download Docker Desktop from https://docker.com/products/docker-desktop"
            echo "  Re-run this script after installation."
            exit 0
        else
            curl -fsSL https://get.docker.com | sh
            echo "  [ok] docker installed"
        fi
    else
        echo "  [!!] Skipping docker -- you will need it later to run the stack"
    fi
fi

echo ""

# --- Install forge ---
echo "  Installing forge..."
uv tool install "$TOOL"
echo ""
echo "  [ok] forge installed. Run 'forge' from anywhere."
echo ""

# --- Offer to run ---
if ask "  Would you like to run forge now?"; then
    forge
fi
