# Docker Tutorial for xgen-mrp Project 🐳

## What is Docker?

Docker is a **containerization platform** that packages your application and all its dependencies into a standardized unit called a **container**. Think of it as a lightweight, portable virtual machine.

### Key Concepts
- **Image**: A snapshot of your application (like a blueprint)
- **Container**: A running instance of an image (like a running program)
- **Dockerfile**: Instructions to build an image
- **docker-compose.yml**: Defines multiple services that work together

## How Docker Works in Our Project

Our xgen-mrp project uses Docker to run:
- **Next.js application** (your main app)
- **PostgreSQL database** (data storage)
- **Adminer** (database management interface)

## Quick Start Guide

### Prerequisites
- Docker Desktop installed
- Terminal/command line access

### Step 1: Fix Port Conflict
```bash
# Kill the process using port 3000
kill -9 72385

# Or use alternative port (edit docker-compose.yml first)
# Change line 27: "3001:3000" instead of "3000:3000"
```

### Step 2: Start Services
```bash
# Navigate to project directory
cd /Users/zafajardo/Documents/Development/inventory\ system/xgen-mrp

# Start all services
docker-compose up -d

# Check status
docker-compose ps
```

### Step 3: Available Services
- **App**: http://localhost:3002
- **Database**: Uses your cloud PostgreSQL via Prisma

## Essential Docker Commands

### Service Management
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f nextjs
docker-compose logs -f postgres

# Restart specific service
docker-compose restart nextjs
```

### Container Operations
```bash
# Execute commands inside container
docker-compose exec nextjs npm run dev
docker-compose exec postgres psql -U inventory_user -d inventory_db

# Access container shell
docker-compose exec nextjs sh
docker-compose exec postgres bash
```

### Development Mode
```bash
# Use development overrides for hot reload
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d
```

## Project Structure

```
xgen-mrp/
├── Dockerfile              # Builds Next.js app
├── docker-compose.yml      # Main services definition
├── docker-compose.override.yml  # Development overrides
├── docker.env.example      # Environment template
├── docker-init.sh          # Database initialization
└── .dockerignore          # Files to exclude from build
```

## Environment Configuration

### 1. Create Environment File
```bash
cp docker.env.example .env
```

### 2. Configure Cloud Database
Edit `.env` to use your cloud PostgreSQL:
```bash
# Use your existing cloud database URL
DATABASE_URL="prisma+postgres://accelerate.prisma-data.net/?api_key=your-key"
NEXTAUTH_URL=http://localhost:3002
NEXTAUTH_SECRET=your-secret-key
```

## Using Docker on Another Machine

### Method 1: Copy Project Files
```bash
# On source machine
git clone <your-repo>
cd xgen-mrp

# On target machine
git clone <your-repo>
cd xgen-mrp
cp docker.env.example .env
# Edit .env with new machine settings
docker-compose up -d
```

### Method 2: Using Docker Hub (Advanced)
```bash
# Build and push image
docker build -t your-username/xgen-mrp .
docker push your-username/xgen-mrp

# On target machine
docker pull your-username/xgen-mrp
docker-compose up -d
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port
lsof -ti:3000
# Kill process
kill -9 <PID>
```

#### Database Connection Issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d

# Check database logs
docker-compose logs postgres
```

#### Build Issues
```bash
# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Development Workflow

1. **Code Changes**: Files auto-sync with container
2. **Database**: Use Adminer at http://localhost:8080
3. **Logs**: Monitor with `docker-compose logs -f`
4. **Shell**: Access with `docker-compose exec nextjs sh`

## Advanced Usage

### Database Management
```bash
# Backup database
docker-compose exec postgres pg_dump -U inventory_user inventory_db > backup.sql

# Restore database
docker-compose exec -T postgres psql -U inventory_user -d inventory_db < backup.sql
```

### Performance Optimization
```bash
# View resource usage
docker stats

# Clean up unused images
docker system prune -a
```

## Quick Reference Card

| Task | Command |
|------|---------|
| Start all services | `docker-compose up -d` |
| Stop all services | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Access app | http://localhost:3002 |
| Database | Uses your cloud PostgreSQL |
| Execute commands | `docker-compose exec nextjs <command>` |
| Reset everything | `docker-compose down -v && docker-compose up -d` |

## Next Steps

1. ✅ Run `docker-compose up -d`
2. ✅ Visit http://localhost:3002 to see your app
3. ✅ Your app connects to your cloud PostgreSQL

## Support

If you encounter issues:
1. Check logs: `docker-compose logs`
2. Verify services: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Reset everything: `docker-compose down -v && docker-compose up -d`
