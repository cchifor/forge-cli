$ErrorActionPreference = "Stop"

$Repo = "https://github.com/your-org/platform.git"
$Tool = "git+${Repo}#subdirectory=forge-cli"

function Ask($msg) {
    $a = Read-Host "$msg [Y/n]"
    return ($a -eq "" -or $a -match "^[Yy]$")
}

function Refresh-Path {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "User") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "Machine")
}

Write-Host ""
Write-Host "  +===================================+"
Write-Host "  |     forge installer          |"
Write-Host "  +===================================+"
Write-Host ""
Write-Host "  Checking prerequisites..."
Write-Host ""

# --- uv (REQUIRED) ---
if (Get-Command uv -ErrorAction SilentlyContinue) {
    Write-Host "  [ok] uv $(uv --version)"
} else {
    Write-Host "  [--] uv is not installed (required)"
    if (Ask "  Install uv now?") {
        irm https://astral.sh/uv/install.ps1 | iex
        Refresh-Path
        Write-Host "  [ok] uv installed"
    } else {
        Write-Host "  [!!] Cannot continue without uv. Aborting."
        exit 1
    }
}

# --- git (recommended) ---
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host "  [ok] git $(git --version)"
} else {
    Write-Host "  [--] git is not installed (needed for project generation)"
    if (Ask "  Install git now?") {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
            Refresh-Path
            Write-Host "  [ok] git installed"
        } else {
            Write-Host "  [!!] winget not available. Download git from https://git-scm.com/downloads/win"
        }
    } else {
        Write-Host "  [!!] Skipping git -- you will need it later for project generation"
    }
}

# --- docker (recommended) ---
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "  [ok] docker $(docker --version)"
} else {
    Write-Host "  [--] docker is not installed (needed to run the generated stack)"
    if (Ask "  Install Docker Desktop now?") {
        if (Get-Command winget -ErrorAction SilentlyContinue) {
            winget install --id Docker.DockerDesktop -e --accept-source-agreements --accept-package-agreements
            Write-Host "  [ok] Docker Desktop installed -- restart may be required"
        } else {
            Write-Host "  [!!] winget not available. Download from https://docker.com/products/docker-desktop"
        }
    } else {
        Write-Host "  [!!] Skipping docker -- you will need it later to run the stack"
    }
}

Write-Host ""

# --- Install forge ---
Write-Host "  Installing forge..."
uv tool install $Tool
Write-Host ""
Write-Host "  [ok] forge installed. Run 'forge' from anywhere."
Write-Host ""

# --- Offer to run ---
if (Ask "  Would you like to run forge now?") {
    forge
}
