# 🐳 XGEN-MRP Docker Deployment Guide

Quick deployment guide for running XGEN-MRP on any machine with Docker.

## 📦 For New Users/Developers

### Step 1: Get the Project
```bash
# Clone the repository
git clone <your-repository-url>
cd xgen-mrp

# OR download and extract the project files
```

### Step 2: Install Docker
- **Windows/Mac**: Download [Docker Desktop](https://docs.docker.com/get-docker/)
- **Linux**: Install Docker and Docker Compose from your package manager

### Step 3: One-Click Setup
```bash
# Make the setup script executable (Linux/Mac)
chmod +x docker-setup.sh

# Run the automated setup
./docker-setup.sh
```

### Step 4: Access the Application
- **👨‍💻 Developers**: http://localhost:3001
- **👥 Users**: http://localhost:3002

## 🔧 Manual Setup (Alternative)

If the automated script doesn't work:

```bash
# 1. Create environment file
cp docker.env.example .env

# 2. Build and start services
docker-compose build
docker-compose up -d

# 3. Check status
docker-compose ps
```

## 🌐 Deployment on Different Machines

### For Team Members
1. Share the project folder or Git repository
2. Each developer runs `./docker-setup.sh`
3. Both environments will be available instantly

### For Production Deployment
```bash
# Start only production environment
docker-compose up xgen-prod -d

# Access at http://localhost:3002
```

### For Cloud Deployment
1. Update the `DATABASE_URL` in `.env` if needed
2. Modify ports in `docker-compose.yml` if required:
   ```yaml
   ports:
     - '80:3000'    # For production on port 80
     - '8080:3001'  # For development on port 8080
   ```

## 🛠 Common Operations

```bash
# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Update application
git pull                    # Get latest code
docker-compose build       # Rebuild images
docker-compose up -d       # Restart services
```

## 🔍 Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -ti:3001  # or 3002

# Kill the process
kill -9 <PID>

# Or change ports in docker-compose.yml
```

### Application Not Loading
```bash
# Check service status
docker-compose ps

# View error logs
docker-compose logs xgen-dev   # or xgen-prod

# Restart services
docker-compose restart
```

### Database Connection Issues
- Verify `DATABASE_URL` in `.env` file
- Ensure your cloud database is accessible
- Check firewall settings

## 📊 System Requirements

- **Minimum**: 4GB RAM, 2 CPU cores, 5GB disk space
- **Recommended**: 8GB RAM, 4 CPU cores, 10GB disk space
- **Docker**: Latest version of Docker Desktop

## 🚀 Quick Reference

| Task | Command |
|------|---------|
| Start everything | `./docker-setup.sh` |
| Stop everything | `docker-compose down` |
| View logs | `docker-compose logs -f` |
| Restart | `docker-compose restart` |
| Development only | `docker-compose up xgen-dev -d` |
| Production only | `docker-compose up xgen-prod -d` |

## 📞 Support

If you encounter issues:
1. Check the logs: `docker-compose logs`
2. Verify Docker is running: `docker ps`
3. Restart services: `docker-compose restart`
4. Clean restart: `docker-compose down && ./docker-setup.sh`

---

🎉 **You're all set!** Visit http://localhost:3001 (dev) or http://localhost:3002 (prod) to access your XGEN-MRP system.
