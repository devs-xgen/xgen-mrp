# Docker Tutorial for xgen-mrp Project 🐳

## What is Docker?

Docker is a **containerization platform** that packages your application and all its dependencies into a standardized unit called a **container**. Think of it as a lightweight, portable virtual machine that ensures your application runs consistently across different environments.

### Key Concepts
- **Image**: A snapshot of your application with all dependencies (like a blueprint)
- **Container**: A running instance of an image (like a running program)
- **Dockerfile**: Instructions to build an image
- **docker-compose.yml**: Defines multiple services that work together

## How Docker Works in Our Project

Our xgen-mrp project uses Docker to provide **two environments**:

### 🔧 Development Environment (Port 3001)
- **Purpose**: For developers working on the code
- **Features**: Hot reload, development tools, source code debugging
- **Access**: http://localhost:3001
- **Use Case**: Code development, testing new features

### 🏭 Production Environment (Port 3002)  
- **Purpose**: For end users and production-like testing
- **Features**: Optimized build, production performance
- **Access**: http://localhost:3002
- **Use Case**: User access, demos, production testing

Both environments connect to your **cloud PostgreSQL database** via Prisma.

## 🚀 Quick Start Guide

### Prerequisites
- Docker Desktop installed ([Download here](https://docs.docker.com/get-docker/))
- Terminal/command line access

### Option 1: One-Click Setup (Recommended)
```bash
# Navigate to project directory
cd "/Users/zafajardo/Documents/Development/inventory system/xgen-mrp"

# Run the automated setup script
./docker-setup.sh
```

This script will:
- ✅ Check Docker installation
- 📝 Create environment configuration
- 🔨 Build Docker images
- 🚀 Start both services
- 📊 Show status and access URLs

### Option 2: Manual Setup
```bash
# Navigate to project directory
cd "/Users/zafajardo/Documents/Development/inventory system/xgen-mrp"

# Create environment file
cp docker.env.example .env

# Build and start services
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

### 🎯 Access Your Applications
- **👨‍💻 Development**: http://localhost:3001 (for developers)
- **👥 Production**: http://localhost:3002 (for users)
- **💾 Database**: Your existing cloud PostgreSQL (no change needed)

## 📋 Essential Docker Commands

### Service Management
```bash
# Start both environments
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f xgen-dev     # Development logs
docker-compose logs -f xgen-prod    # Production logs
docker-compose logs -f              # Both services

# Restart specific service
docker-compose restart xgen-dev     # Restart development
docker-compose restart xgen-prod    # Restart production

# Check service status
docker-compose ps
```

### Container Operations
```bash
# Execute commands inside containers
docker-compose exec xgen-dev npm run lint           # Run linting in dev
docker-compose exec xgen-dev npm run test           # Run tests in dev
docker-compose exec xgen-prod npm run start         # Check production start

# Access container shell
docker-compose exec xgen-dev sh     # Development container shell
docker-compose exec xgen-prod sh    # Production container shell
```

### Development Workflow
```bash
# Start development environment only
docker-compose up xgen-dev -d

# Rebuild after code changes
docker-compose build xgen-dev
docker-compose up xgen-dev -d

# Watch logs during development
docker-compose logs -f xgen-dev
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
