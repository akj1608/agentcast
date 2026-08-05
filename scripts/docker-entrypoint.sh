#!/bin/sh
set -e

echo "Syncing database schema..."
./node_modules/.bin/prisma db push --skip-generate

echo "Checking seed..."
./node_modules/.bin/tsx prisma/seed-if-empty.ts

echo "Starting server..."
exec ./node_modules/.bin/tsx server.ts
