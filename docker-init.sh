#!/bin/bash

# Run Prisma client generation if needed
echo "Generating Prisma client..."
npx prisma generate

# Skip migrations since you're using a hosted DB
# You may want to run migrations manually or through your CI/CD pipeline

echo "Database initialization completed"