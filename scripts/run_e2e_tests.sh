#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Playwright E2E tests..."
cd "$(dirname "$0")/.."
npm run test:e2e
