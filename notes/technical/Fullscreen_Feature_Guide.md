# Fullscreen Feature Guide

This document explains how to implement and use the fullscreen feature in the XGen MRP application.

## Overview

The fullscreen feature in XGen MRP provides two types of fullscreen functionality:

1. **Global Fullscreen** - Makes the entire browser window fullscreen (hides all browser UI), creating a desktop application-like experience
2. **Component Fullscreen** - Makes a specific container within the page fullscreen, similar to YouTube's video player

Both types of fullscreen persist their state in localStorage, so user preferences are remembered between visits.

## Global Fullscreen

### Components

The global fullscreen feature consists of the following components:

1. `GlobalFullscreenButton` - A button component that toggles the entire browser into fullscreen mode
2. `GlobalFullscreenToggle` - A minimal floating button that's fixed in the bottom-right corner of the screen

### Usage

The global fullscreen toggle is already included in the root layout, so it's available on every page. Additionally, you can add the `GlobalFullscreenButton` to specific pages:

```tsx
import { GlobalFullscreenButton } from "@/components/ui/global-fullscreen-button";

// In your component:
<div className="flex justify-between">
  <h1>My Page Title</h1>
  <GlobalFullscreenButton showText />
</div>
```

### Keyboard Shortcut

Users can toggle global fullscreen mode by pressing the **F11** key. This is a convenient way to enter or exit fullscreen mode without having to click a button.

### Customization Options

The `GlobalFullscreenButton` component accepts the following props:

- `variant`: Button variant (default, destructive, outline, secondary, ghost, link)
- `size`: Button size (default, sm, lg, icon)
- `className`: Additional CSS classes
- `showText`: Whether to show text next to the icon (default: false)

## Component Fullscreen

### Components

The component fullscreen feature consists of the following components:

1. `FullscreenProvider` - Context provider for fullscreen state management
2. `FullscreenButton` - Button component to toggle fullscreen mode for a specific container
3. `FullscreenToggle` - Minimal icon-only toggle for fullscreen mode
4. `FullscreenToggleWrapper` - Wrapper component that adds a fullscreen toggle to any content

### Basic Usage

To add component fullscreen functionality to any page or component:

1. Add an ID to the container you want to make fullscreen:

```tsx
<div id="my-container">
  {/* Your content */}
</div>
```

2. Add the FullscreenButton component:

```tsx
import { FullscreenButton } from "@/components/ui/fullscreen-button";

// In your component:
<div className="flex justify-between">
  <h1>My Page Title</h1>
  <FullscreenButton containerId="my-container" />
</div>
```

### Using the Wrapper Component

For quick implementation, you can use the `FullscreenToggleWrapper`:

```tsx
import { FullscreenToggleWrapper } from "@/components/ui/fullscreen-toggle-wrapper";

<FullscreenToggleWrapper id="my-content">
  {/* Your content */}
</FullscreenToggleWrapper>
```

## Styling in Fullscreen Mode

Custom styles for fullscreen mode are defined in `globals.css`. You can customize the appearance of elements in fullscreen mode by modifying these styles.

## Browser Support

The fullscreen API is supported in all modern browsers. The implementation includes fallbacks for different browser prefixes.

## Best Practices

1. Use the global fullscreen feature for a desktop application-like experience
2. Use component fullscreen for focusing on specific content within a page
3. Place fullscreen buttons in consistent locations across the application
4. Consider using the `showText` option for better user experience
5. Inform users about the F11 keyboard shortcut for quick access
6. Test the feature in different browsers to ensure compatibility

## Example Implementation

### Global Fullscreen on Main Page

```tsx
<div className="flex justify-between items-center mb-6">
  <XgenLogo />
  <GlobalFullscreenButton showText />
</div>
```

### Component Fullscreen on Worker Dashboard

```tsx
<div id="worker-dashboard" className="space-y-6">
  <div className="flex justify-between items-center">
    <div>
      <h2 className="text-3xl font-bold tracking-tight">Worker Dashboard</h2>
      <p className="text-muted-foreground">
        Your work overview and assigned tasks
      </p>
    </div>
    <div>
      <FullscreenButton 
        containerId="worker-dashboard" 
        variant="outline"
        showText
      />
    </div>
  </div>
  
  {/* Rest of the dashboard content */}
</div>
``` 