#!/bin/bash

# Wait for PostgreSQL to be ready
if [ "$NODE_ENV" = "development" ]; then
  echo "Waiting for PostgreSQL to be ready..."
  while ! nc -z postgres 5432; do
    sleep 1
  done
  echo "PostgreSQL is ready!"
fi

# Run Prisma client generation
echo "Generating Prisma client..."
npx prisma generate

# Run migrations in development
if [ "$NODE_ENV" = "development" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
  echo "Seeding database..."
  npm run db:seed || echo "No seed script found, skipping..."
fi

echo "Database initialization completed"