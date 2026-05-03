#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Stripe integration tests (mocked SDK, no network)..."
cd "$(dirname "$0")/.."
npm run test:integration
