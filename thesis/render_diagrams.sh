#!/usr/bin/env bash
# Render thesis Mermaid diagrams to PNG via mermaid-cli (npx), using the
# Chromium already cached by Playwright (no system install / no sudo).
set -euo pipefail
cd "$(dirname "$0")"

CHROME="$(ls -d "$HOME"/.cache/ms-playwright/chromium-*/chrome-linux64/chrome 2>/dev/null | head -1)"
if [ -z "${CHROME:-}" ] || [ ! -x "$CHROME" ]; then
  echo "cached Chromium not found under ~/.cache/ms-playwright" >&2
  exit 1
fi
export PUPPETEER_EXECUTABLE_PATH="$CHROME"

PCFG="$(mktemp /tmp/puppeteer-XXXX.json)"
echo '{"args":["--no-sandbox","--disable-dev-shm-usage"]}' > "$PCFG"
trap 'rm -f "$PCFG"' EXIT

render() { # <mmd> <out> <scale>
  npx -y @mermaid-js/mermaid-cli@latest \
    -i "diagrams/$1" -o "figures/$2" \
    -b white -s "${3:-3}" -p "$PCFG"
  echo "rendered figures/$2"
}

render use-case.mmd     1-4.png 3
render architecture.mmd 3-1.png 3
render er.mmd           3-2.png 3
render class.mmd        3-3.png 3
