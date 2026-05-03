#!/usr/bin/env bash
set -euo pipefail

echo "▶ Starting Stripe webhook forwarder → http://localhost:3000/api/webhooks/stripe"
echo "  (make sure 'npm run dev' is running in another terminal)"
echo
stripe listen --forward-to localhost:3000/api/webhooks/stripe
