# PWA Icons Guide for XGEN MRP

## Required Icon Sizes

You need to create the following PWA icons from your logo:

### App Icons (Square)
- `icon-72x72.png` - 72x72 pixels
- `icon-96x96.png` - 96x96 pixels
- `icon-128x128.png` - 128x128 pixels
- `icon-144x144.png` - 144x144 pixels
- `icon-152x152.png` - 152x152 pixels
- `icon-192x192.png` - 192x192 pixels (Android home screen)
- `icon-384x384.png` - 384x384 pixels
- `icon-512x512.png` - 512x512 pixels (Android splash screen)

### Shortcut Icons
- `admin-shortcut.png` - 96x96 pixels (Admin dashboard shortcut)
- `worker-shortcut.png` - 96x96 pixels (Worker dashboard shortcut)
- `inspector-shortcut.png` - 96x96 pixels (Inspector dashboard shortcut)

### Screenshots (Optional but recommended)
- `desktop-dashboard.png` - 1280x720 pixels (Desktop screenshot)
- `mobile-dashboard.png` - 375x667 pixels (Mobile screenshot)

## Design Guidelines

1. **Logo**: Use the XGEN logo on a square background
2. **Background**: Use white or black background (#FFFFFF or #000000)
3. **Padding**: Add 10-15% padding around the logo
4. **Format**: PNG with transparency support
5. **Color**: Ensure good contrast for visibility

## Quick Generation

You can use online tools like:
- https://www.pwabuilder.com/imageGenerator
- https://app-manifest.firebaseapp.com/
- https://tools.crawlink.com/tools/pwa-icon-generator/

## File Structure
```
public/images/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
├── icon-512x512.png
├── admin-shortcut.png
├── worker-shortcut.png
└── inspector-shortcut.png
```

## Testing

After adding icons, test your PWA:
1. Open Chrome DevTools
2. Go to Application tab
3. Check Manifest section
4. Verify all icons load correctly
5. Test installation on mobile devices