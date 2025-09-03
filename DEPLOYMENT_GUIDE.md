# Docker Deployment Guide

## Quick Start - Single Command Deployment

For users who want to run the inventory system with Docker:

```bash
# Install Docker first, then run:
git clone <repository-url>
cd xgen-mrp
docker-compose up -d
```

## Access Points

- **Development Environment**: http://localhost:3001 (with hot reload)
- **Production Environment**: http://localhost:3003 (optimized build)

## Services

- `dev`: Development server with live reload on port 3001
- `prod`: Production build running on port 3002

## Environment Variables

Create a `.env` file in the project root:

```bash
NEXTAUTH_SECRET=your-secret-key-here
```

## Troubleshooting

If you encounter build issues:

1. **Clean build**: `docker-compose down && docker-compose up -d --build`
2. **Check logs**: `docker-compose logs [service-name]`
3. **Port conflicts**: Ensure ports 3001 and 3002 are available

## Commands

```bash
# Start both services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs dev    # Development logs
docker-compose logs prod   # Production logs

# Rebuild and restart
docker-compose up -d --build
```
