# Maintenance Mode Configuration

## Overview
The XGen MRP system includes a maintenance mode feature that allows administrators to temporarily disable access to the system while performing updates or maintenance.

## Configuration

### Environment Variable
Add the following environment variable to your `.env` file:

```bash
# Maintenance Mode
# Set to 'true' to enable maintenance mode, 'false' or omit to disable
MAINTENANCE_MODE=false
```

### How It Works
- When `MAINTENANCE_MODE=true`, all users will see a maintenance page instead of the normal application
- When `MAINTENANCE_MODE=false` or the variable is not set, the system operates normally
- The maintenance page displays a professional "under construction" message with system status information

## Usage

### Enable Maintenance Mode
1. Set `MAINTENANCE_MODE=true` in your `.env` file
2. Restart the application
3. All users will now see the maintenance page

### Disable Maintenance Mode
1. Set `MAINTENANCE_MODE=false` in your `.env` file (or remove the variable)
2. Restart the application
3. Users can now access the system normally

## Features of Maintenance Page
- Professional design with company branding
- Clear messaging about system status
- Expected duration information
- Contact information for urgent matters
- Responsive design for all devices
- Dark mode support

## Security
- The maintenance mode check happens at the root layout level
- No authentication or application logic is loaded when in maintenance mode
- This ensures system security during maintenance periods

## Example .env Configuration
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/xgen_mrp"

# NextAuth
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Maintenance Mode
MAINTENANCE_MODE=false
```
