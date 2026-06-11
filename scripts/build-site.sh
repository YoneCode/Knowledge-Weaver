#!/usr/bin/env bash
# Combined build: emits a single dist/ that Cloudflare Pages serves directly.
#   /        -> Next.js static-exported landing (landing/out/*)
#   /app/    -> Vite-built dashboard (frontend/dist/*)
#
# Used by `npm run build` at the repo root. Cloudflare Pages config:
#   Build command: npm run build
#   Build output:  dist
#   Root:          /  (leave blank)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIST="$ROOT/dist"

echo "▶ cleaning dist/"
rm -rf "$DIST"
mkdir -p "$DIST"

echo "▶ building landing (Next.js static export)"
( cd "$ROOT/landing" && npm ci --no-audit --no-fund && npm run build )
cp -a "$ROOT/landing/out/." "$DIST/"

echo "▶ building dashboard (Vite, base=/app/)"
( cd "$ROOT/frontend" && npm ci --no-audit --no-fund && npm run build )
mkdir -p "$DIST/app"
cp -a "$ROOT/frontend/dist/." "$DIST/app/"

# Cloudflare Pages SPA fallback for the dashboard.
# Any /app/* path serves /app/index.html (HTTP 200) so client-side routing works.
cat > "$DIST/_redirects" <<'EOF'
/app/*  /app/index.html  200
EOF

echo "✓ Build complete"
echo "  dist/index.html      → landing"
echo "  dist/app/index.html  → dashboard"
