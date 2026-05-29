# Panning Troubleshooting Guide

If the canvas grab/pan functionality isn't working, try these steps.

## Current Configuration

The ReactFlow component is configured with:

```javascript
nodesDraggable={false}        // Nodes can't be dragged
nodesConnectable={false}      // Nodes can't be connected
elementsSelectable={true}     // Nodes/edges can be selected
panOnDrag={[1, 2]}           // Pan with left (1) or middle (2) mouse button
panOnScroll={false}          // Scroll doesn't pan
zoomOnScroll={true}          // Scroll zooms instead
selectionOnDrag={false}      // No box selection on drag
```

## How to Pan

**Method 1: Left-Click Drag** (Primary)
1. Move mouse over **empty gray background** (not on a node)
2. Click and hold **left mouse button**
3. Drag to pan
4. Release to stop

**Method 2: Middle-Click Drag**
1. Click and hold **middle mouse button** (scroll wheel)
2. Drag anywhere on canvas
3. Release to stop

**Method 3: MiniMap**
1. Look at bottom-right corner
2. Click and drag the **viewport rectangle** in the mini-map

**Method 4: Space + Drag** (may work depending on browser)
1. Hold **Space bar**
2. Click and drag
3. Release space

## Troubleshooting Steps

### 1. Verify You're Clicking Empty Space

❌ **Wrong**: Clicking on a node (colored box)
✅ **Correct**: Clicking on gray background between nodes

**Test**: Try clicking in an area with no nodes at all.

### 2. Check Cursor Changes

When hovering over empty space, the cursor should show:
- **Grab hand** (✋) when ready to pan
- **Grabbing hand** (✊) when panning

If you don't see the cursor change:
- Your browser might not be applying the cursor styles
- Try a different browser (Chrome/Edge recommended)

### 3. Try Middle Mouse Button

If left-click doesn't work:
1. Try clicking and dragging with the **middle mouse button** (scroll wheel click)
2. This often bypasses browser/OS conflicts

### 4. Use the MiniMap

The mini-map (bottom-right) always works:
1. Click the **blue viewport rectangle**
2. Drag it around
3. This pans the main canvas

### 5. Check Browser Console

1. Press **F12** to open DevTools
2. Go to **Console** tab
3. Look for any errors (red text)
4. Particularly look for:
   - "Failed to execute 'drag'" errors
   - React Flow warnings
   - JavaScript errors

### 6. Disable Browser Extensions

Some extensions interfere with canvas interactions:
1. Open an **incognito/private window**
2. Load the site there
3. Try panning again

Common culprits:
- Mouse gesture extensions
- Accessibility tools
- Screen recorders
- Security/privacy extensions

### 7. Check OS Accessibility Settings

**Windows:**
- Settings → Ease of Access → Mouse pointer
- Disable "Select a window by hovering over it"

**macOS:**
- System Preferences → Accessibility → Pointer Control
- Check "Mouse & Trackpad" settings

**Linux:**
- Check window manager settings
- Some tiling WMs intercept drag events

### 8. Try Different Mouse/Input

- **Trackpad**: Try using a mouse
- **Mouse**: Try using the trackpad
- **Wireless**: Try a wired device
- **USB**: Try different USB port

### 9. Check Zoom Level

If zoomed in too much:
1. Use **mouse wheel** to zoom out
2. Click the **fit-view button** (□ icon, bottom-left)
3. Try panning again

### 10. Clear Browser Cache

1. **Ctrl+Shift+Delete** (or **Cmd+Shift+Delete** on Mac)
2. Select "Cached images and files"
3. Clear cache
4. **Hard refresh**: **Ctrl+Shift+R** (or **Cmd+Shift+R**)

## Alternative Navigation Methods

If panning still doesn't work, you can navigate using:

### Zoom Controls (Bottom-Left)
- **+** button: Zoom in
- **-** button: Zoom out
- **□** button: Fit all nodes in view
- **⊙** button: Center view

### MiniMap (Bottom-Right)
- Click and drag the blue rectangle
- Click anywhere on the mini-map to jump there

### Mouse Wheel
- Scroll to zoom in/out
- Zooming changes which area is visible

### Keyboard (if implemented)
- Arrow keys might pan (browser dependent)

## Debugging: What Should Happen

When panning works correctly:

1. **Hover over background**
   - Cursor changes to grab hand (✋)

2. **Click and hold**
   - Cursor changes to grabbing hand (✊)

3. **Move mouse**
   - Canvas moves with mouse
   - Nodes stay in relative positions

4. **Release**
   - Cursor returns to grab hand (✋)
   - Canvas stays at new position

## Known Issues

### Issue: Cursor shows grab hand but doesn't pan

**Possible causes:**
- File drop handler interference (should be fixed)
- Browser zoom level conflict
- Extension interference

**Solutions:**
- Try middle mouse button
- Try incognito mode
- Use mini-map instead

### Issue: Panning works but is "sticky" or laggy

**Possible causes:**
- Large graph (many nodes)
- Browser performance
- Low system memory

**Solutions:**
- Close other tabs
- Disable descendants view
- Use a smaller scope
- Try horizontal layout (faster than grid)

### Issue: Panning works on nodes but not background

**This is actually normal!** You should click on the background, not nodes.

## Reporting Issues

If panning still doesn't work, please provide:

1. **Browser**: Name and version (e.g., "Chrome 120")
2. **OS**: Name and version (e.g., "Windows 11")
3. **Mouse/Input**: Type of device
4. **Console errors**: Any red errors in F12 console
5. **What happens**: Describe what you see when you try to pan
6. **Cursor**: Does the cursor change to a hand?
7. **Middle button**: Does middle-click panning work?
8. **Mini-map**: Does mini-map panning work?

## Technical Details

### panOnDrag Configuration

```javascript
panOnDrag={[1, 2]}
```

This means:
- `[1]` = Left mouse button (primary click)
- `[2]` = Middle mouse button (scroll wheel click)
- `[0]` = Right mouse button (not used, reserved for context menus)

### Why `[1, 2]` Instead of `true`

- `true` defaults to `[0, 1, 2]` which includes right-click
- We use `[1, 2]` to exclude right-click
- This prevents conflicts with context menus

### File Drop Handler

The file drop handler checks for actual file drops:

```javascript
if (event.dataTransfer.types && event.dataTransfer.types.includes('Files')) {
  event.preventDefault();
}
```

This should NOT interfere with panning, but if it does:
- The fix would be to move the drop handler
- Or to check the event source more carefully

## Quick Fixes to Try Right Now

1. ✅ **Middle mouse button** - Click scroll wheel and drag
2. ✅ **Mini-map** - Drag the blue rectangle (bottom-right)
3. ✅ **Incognito window** - Bypass extensions
4. ✅ **Different browser** - Chrome/Edge work best
5. ✅ **Zoom out first** - Use mouse wheel to see more nodes

## Summary

Panning should work with:
- **Left-click drag** on empty background
- **Middle-click drag** anywhere
- **Mini-map drag** in bottom-right corner

If none of these work, try a different browser or check for system/extension conflicts.
