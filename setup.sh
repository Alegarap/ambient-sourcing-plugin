#!/usr/bin/env bash
# Setup script for the ambient-sourcing Claude Code plugin
# Checks 1Password CLI, vault access, and Supabase connectivity.

set -euo pipefail

PLUGIN_DIR="$(cd "$(dirname "$0")" && pwd)"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}OK${NC} $1"; }
fail() { echo -e "  ${RED}FAIL${NC} $1"; }
warn() { echo -e "  ${YELLOW}NOTE${NC} $1"; }

echo "=== Ambient Sourcing Plugin Setup ==="
echo ""

# --- Step 1: Check Node.js ---
echo "1. Checking Node.js..."
if command -v node &>/dev/null; then
    NODE_VER=$(node --version)
    pass "Node.js $NODE_VER"
else
    fail "Node.js not found"
    echo "     Install: brew install node"
    exit 1
fi

# --- Step 2: Check npm dependencies ---
echo "2. Checking npm dependencies..."
if [ -d "$PLUGIN_DIR/node_modules" ] && [ -d "$PLUGIN_DIR/dist" ]; then
    pass "Dependencies installed and built"
else
    echo "   Installing dependencies and building..."
    cd "$PLUGIN_DIR"
    npm install --silent 2>/dev/null
    npx tsc 2>/dev/null
    pass "Built successfully"
fi

# --- Step 3: Check 1Password CLI ---
echo "3. Checking 1Password CLI..."
if command -v op &>/dev/null; then
    OP_VER=$(op --version 2>/dev/null || echo "unknown")
    pass "1Password CLI v$OP_VER"
else
    fail "1Password CLI not found"
    echo ""
    echo "     The 1Password CLI is required to resolve credentials."
    echo "     Install it with:"
    echo ""
    echo "       brew install 1password-cli"
    echo ""
    echo "     Then sign in:"
    echo ""
    echo "       op signin"
    echo ""
    echo "     For biometric unlock (recommended), enable it in:"
    echo "       1Password app > Settings > Developer > CLI integration"
    echo ""
    exit 1
fi

# --- Step 4: Check vault access ---
echo "4. Checking lunar-secrets vault access..."
if op vault get lunar-secrets &>/dev/null; then
    pass "lunar-secrets vault accessible"
else
    fail "Cannot access lunar-secrets vault"
    echo ""
    echo "     Make sure you:"
    echo "       1. Are signed in: op signin"
    echo "       2. Have access to the lunar-secrets vault"
    echo "       3. Ask Alejandro to share the vault if needed"
    echo ""
    exit 1
fi

# --- Step 5: Test credential resolution ---
echo "5. Testing credential resolution..."
SUPABASE_KEY=$(op read "op://lunar-secrets/Supabase Ambient Sourcing/service role key" 2>/dev/null || echo "")
if [ -n "$SUPABASE_KEY" ]; then
    pass "Supabase credentials resolve"
else
    fail "Cannot read Supabase credentials from 1Password"
    echo "     Item: 'Supabase Ambient Sourcing' in lunar-secrets vault"
    exit 1
fi

# --- Step 6: Test Supabase connectivity ---
echo "6. Testing Supabase connectivity..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "apikey: $SUPABASE_KEY" \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    "https://mmzcyfwklvugqerwczzm.supabase.co/rest/v1/clusters?select=id&limit=1" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    pass "Supabase reachable (HTTP $HTTP_CODE)"
else
    fail "Supabase returned HTTP $HTTP_CODE"
    echo "     Check your network connection and credentials."
    exit 1
fi

# --- Step 7: Check OpenRouter (optional) ---
echo "7. Checking OpenRouter API key (for semantic search)..."
OR_KEY=$(op read "op://lunar-secrets/Supabase Ambient Sourcing/OpenRouter Ambient Sourcing CC Plugin" 2>/dev/null || echo "")
if [ -n "$OR_KEY" ]; then
    pass "OpenRouter credentials resolve"
else
    warn "OpenRouter key not found — semantic search will be unavailable"
    echo "     Keyword search and all other tools will still work."
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To use the plugin, launch Claude Code with credentials injected."
echo "Add this function to your ~/.zshrc (or ~/.bashrc):"
echo ""
echo '  claude-sourcing() {'
echo '      local resolved'
echo "      resolved=\$(op run --no-masking --env-file=$PLUGIN_DIR/.env.1password -- printenv | grep -E '^(SUPABASE_|OPENROUTER_)') || return 1"
echo '      while IFS='"'"'='"'"' read -r key value; do'
echo '          export "$key=$value"'
echo '      done <<< "$resolved"'
echo '      claude'
echo '  }'
echo ""
echo "Then run: source ~/.zshrc && claude-sourcing"
echo ""

# --- Offer to append to shell profile ---
SHELL_RC="$HOME/.zshrc"
[ -f "$HOME/.bashrc" ] && [ ! -f "$HOME/.zshrc" ] && SHELL_RC="$HOME/.bashrc"

read -p "Add claude-sourcing function to $SHELL_RC? [y/N] " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if grep -q "claude-sourcing" "$SHELL_RC" 2>/dev/null; then
        warn "claude-sourcing already exists in $SHELL_RC — skipping"
    else
        cat >> "$SHELL_RC" << FUNC

# Claude Code with ambient sourcing plugin credentials (1Password)
claude-sourcing() {
    local resolved
    resolved=\$(op run --no-masking --env-file=$PLUGIN_DIR/.env.1password -- printenv | grep -E '^(SUPABASE_|OPENROUTER_)') || return 1
    while IFS='=' read -r key value; do
        export "\$key=\$value"
    done <<< "\$resolved"
    claude
}
FUNC
        pass "Added claude-sourcing to $SHELL_RC"
        echo "     Run: source $SHELL_RC && claude-sourcing"
    fi
fi
