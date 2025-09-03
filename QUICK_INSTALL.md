# 🚀 XGEN-MRP Quick Install Guide

**Get XGEN-MRP running on your computer in 5 minutes!**

## 📋 What You Need
- A computer (Windows, Mac, or Linux)
- Internet connection
- 10 minutes of your time

## 🎯 Option 1: Super Easy Installation (Recommended)

### Step 1: Install Docker
**Choose your operating system:**

**🖥️ Windows:**
1. Download [Docker Desktop for Windows](https://docs.docker.com/desktop/windows/install/)
2. Run the installer and follow the prompts
3. Restart your computer when asked

**🍎 Mac:**
1. Download [Docker Desktop for Mac](https://docs.docker.com/desktop/mac/install/)
2. Drag Docker to Applications folder
3. Open Docker from Applications

**🐧 Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```
Log out and back in after installation.

### Step 2: Get XGEN-MRP
**Option A: Download ZIP**
1. Download the project ZIP file
2. Extract it to your desired folder
3. Open Terminal/Command Prompt in that folder

**Option B: Git Clone (if you have Git)**
```bash
git clone <repository-url>
cd xgen-mrp
```

### Step 3: One-Click Setup
**Windows (Command Prompt):**
```cmd
docker-setup.sh
```

**Mac/Linux (Terminal):**
```bash
chmod +x docker-setup.sh
./docker-setup.sh
```

### Step 4: Access Your System
🎉 **That's it!** Open your web browser and go to:
- **For regular use**: http://localhost:3002
- **For development**: http://localhost:3001

## 🎯 Option 2: Manual Installation (If Option 1 doesn't work)

```bash
# 1. Create environment file
cp docker.env.example .env

# 2. Start the system
docker-compose up -d

# 3. Wait 2 minutes for setup to complete

# 4. Open http://localhost:3002 in your browser
```

## 🛠️ Daily Usage

### Starting the System
```bash
docker-compose up -d
```
Then visit: http://localhost:3002

### Stopping the System
```bash
docker-compose down
```

### Checking if it's Running
```bash
docker-compose ps
```

## 🔧 Troubleshooting

### "Port already in use" Error
```bash
# Kill what's using the port
sudo lsof -ti:3002 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3002        # Windows (then kill the PID)
```

### "Docker not found" Error
- Make sure Docker Desktop is running
- Restart Docker Desktop
- On Windows: Make sure you're using Command Prompt as Administrator

### System Won't Load
```bash
# View error logs
docker-compose logs

# Restart everything
docker-compose down
docker-compose up -d
```

### Need Help?
```bash
# Check what's running
docker ps

# View detailed logs
docker-compose logs -f

# Restart specific service
docker-compose restart xgen-prod
```

## 📱 System Requirements

**Minimum:**
- 4GB RAM
- 2GB free disk space
- Any modern browser (Chrome, Firefox, Safari, Edge)

**Recommended:**
- 8GB RAM
- 5GB free disk space
- Fast internet for initial download

## 🌐 Network Setup (Optional)

### Access from Other Devices on Your Network
1. Find your computer's IP address:
   - **Windows**: `ipconfig`
   - **Mac/Linux**: `ifconfig` or `ip addr`
2. Others can access via: `http://YOUR-IP:3002`

### Custom Ports (if needed)
Edit `docker-compose.yml` and change:
```yaml
ports:
  - '8080:3000'  # Use port 8080 instead of 3002
```

## 🔄 Updating the System

```bash
# Get latest version
git pull  # or download new ZIP

# Rebuild and restart
docker-compose build
docker-compose up -d
```

## ❓ FAQ

**Q: Do I need to know programming?**
A: No! This is designed for end users. Just follow the installation steps.

**Q: Will this affect my other programs?**
A: No, everything runs in isolated containers.

**Q: Can multiple people use it?**
A: Yes! Each person can install it on their computer, or share access via network.

**Q: Is my data safe?**
A: Yes, it uses secure cloud database storage.

**Q: Can I use it offline?**
A: You need internet for initial setup and database access.

---

## 🎉 Quick Start Checklist

- [ ] Install Docker Desktop
- [ ] Download XGEN-MRP files
- [ ] Run `./docker-setup.sh`
- [ ] Open http://localhost:3002
- [ ] Start using the system!

**Need help?** The system includes detailed tutorials and help sections once you're logged in.

---

🚀 **Ready to go?** Your XGEN-MRP system is now running locally on your computer!
