#!/bin/bash
set -e

echo "=== DEPLOY TRIGGERED BY GITHUB ACTIONS ==="

cd /srv/sae/TrackrAI

git pull origin main

docker compose down
docker compose build --no-cache
docker compose up -d

echo "=== Trackr deploy done ==="
