# Logout URL Configuration

This document explains how to configure the logout callback URL for different deployment scenarios.

## Overview

The logout functionality now supports configurable callback URLs through environment variables, making it flexible for different deployment environments.

## Environment Variables

The logout URL is determined by the following priority order:

1. **`NEXTAUTH_URL`** - NextAuth base URL (only the origin is used) - highest priority
2. **`NEXT_PUBLIC_APP_URL`** - General application URL  
3. **Dynamic detection** - `window.location.origin` (client-side only)
4. **Fallback** - `"/"` (relative path)

## Configuration Examples

### Development Environment

```bash
# Option 1: Use dynamic detection (recommended for development)
# No additional configuration needed

# Option 2: Use your existing NextAuth URL
NEXTAUTH_URL="http://localhost:3001"
```

### Production Environment

```bash
# Recommended: Use your existing NextAuth URL (most common)
NEXTAUTH_URL="https://yourdomain.com"

# Alternative: Use general app URL
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

### Docker Deployment

```bash
# Use your existing NextAuth URL (already configured)
NEXTAUTH_URL="https://yourdomain.com"

# In docker-compose.yml (already set up):
environment:
  - NEXTAUTH_URL=${NEXTAUTH_URL}
```

### Vercel Deployment

```bash
# Use your NextAuth URL
NEXTAUTH_URL="https://your-app.vercel.app"
```

### Netlify Deployment

```bash
# Use your NextAuth URL
NEXTAUTH_URL="https://your-app.netlify.app"
```

## Custom Logout Paths

You can configure logout to redirect to specific paths by using `NEXT_PUBLIC_APP_URL`:

```bash
# Redirect to a custom landing page  
NEXT_PUBLIC_APP_URL="https://yourdomain.com/goodbye"

# Redirect to a different application
NEXT_PUBLIC_APP_URL="https://company-portal.com"

# Most common: Use your existing NextAuth URL
NEXTAUTH_URL="https://yourdomain.com"  # Will redirect to https://yourdomain.com
```

## Implementation Details

The logout URL configuration is handled by:

- **Utility Function**: `/src/lib/utils/logout-url.ts`
- **AppSidebar Component**: `/src/components/shared/AppSidebar.tsx`
- **Next.js Configuration**: `/next.config.js`

### Code Example

```typescript
import { getLogoutCallbackUrl } from '@/lib/utils/logout-url';

// Get the configured logout URL
const logoutUrl = getLogoutCallbackUrl();

// Use with NextAuth signOut
signOut({ callbackUrl: logoutUrl });
```

## Testing

To test logout configuration:

1. Set your desired environment variable
2. Restart your development server
3. Login to any portal
4. Click "Sign Out" in the sidebar
5. Verify you're redirected to the expected URL

## Troubleshooting

### Common Issues

1. **Not redirecting to expected URL**
   - Check `NEXTAUTH_URL` environment variable spelling
   - Ensure the URL format is valid (include protocol: `https://`)
   - Restart your development server after changing variables

2. **Still redirecting to "/"**
   - Verify `NEXTAUTH_URL` is properly set and accessible
   - Check browser developer tools for any URL construction errors
   - Ensure NextAuth is properly configured

3. **Docker/Container issues**
   - Ensure `NEXTAUTH_URL` is properly passed to the container
   - Check docker-compose.yml configuration
   - Verify NEXTAUTH_URL is accessible from the container

### Debug Information

In development mode, you can check the resolved logout URL:

```javascript
// In browser console
console.log('NextAuth URL:', process.env.NEXTAUTH_URL);
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL);
```

## Security Considerations

- Always use HTTPS in production
- Ensure logout URLs point to trusted domains
- Avoid exposing sensitive URLs in environment variables
- Consider using relative paths for internal redirects

## Migration from Hardcoded URLs

If you were previously using hardcoded logout URLs:

1. **No action required** - The system will use your existing `NEXTAUTH_URL`
2. **Recommended**: Ensure `NEXTAUTH_URL` is properly configured for your deployment
3. **Optional**: Set `NEXT_PUBLIC_APP_URL` for custom behavior
