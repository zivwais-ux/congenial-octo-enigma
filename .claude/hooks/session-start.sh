#!/bin/bash
# Street Eats Asia — SessionStart hook for Claude Code on the web.
# Installs JS dependencies so `npm run typecheck` and `npm run export:web`
# work immediately in a session. Idempotent and non-interactive.
set -euo pipefail

# Only run in the remote (web) environment; local machines manage their own deps.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# node_modules is cached across sessions after the hook completes; `npm install`
# is a no-op when already satisfied, so this stays fast on warm containers.
if [ -f package-lock.json ]; then
  npm install --no-audit --no-fund
fi
