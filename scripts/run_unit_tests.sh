#!/usr/bin/env bash
set -euo pipefail

echo "▶ Running Jest unit tests..."
cd "$(dirname "$0")/.."
npm test
