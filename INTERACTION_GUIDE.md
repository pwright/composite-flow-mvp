# Canvas Interaction Guide

This guide explains how to interact with the React Flow canvas in the Compose Flow MVP.

## Mouse/Trackpad Controls

### Panning (Moving Around)

**Click and Drag on Empty Space**
- Click on any empty area of the canvas
- Hold and drag to pan the view
- Works on background, between nodes

**Using MiniMap**
- Click and drag the viewport rectangle in the mini-map (bottom-right)
- Quick way to navigate large graphs

### Zooming

**Mouse Wheel**
- Scroll up: Zoom in
- Scroll down: Zoom out
- Zooms toward cursor position

**Pinch Gesture** (trackpad/touchscreen)
- Pinch out: Zoom in
- Pinch in: Zoom out

**Controls Panel** (bottom-left)
- Click `+` button to zoom in
- Click `-` button to zoom out
- Click fit-view button (square icon) to fit all nodes in view

### Selecting

**Click on Node**
- Click any block/node to select it
- Selection shows in the Inspector panel (right sidebar)
- Node outline highlights when selected

**Click on Edge**
- Click any connection line to select it
- Binding details show in Inspector panel
- Edge highlights when selected

**Click on Empty Space**
- Clears selection
- Inspector panel shows "No selection"

### Double-Click

**On Empty Space**
- Does nothing (double-click zoom is disabled to prevent accidental zooms)

## Keyboard Shortcuts

React Flow provides these built-in shortcuts:

- **Cmd/Ctrl + Mouse Wheel**: Alternative zoom
- **Space + Drag**: Alternative pan method (may not work due to browser)

## Touch Controls

### Mobile/Tablet

**Pan**
- Single finger drag on empty space

**Zoom**
- Pinch gesture (two fingers)

**Select**
- Tap on node or edge

## What Works vs What Doesn't

### ✅ Working

- ✅ Click and drag on empty space to pan
- ✅ Mouse wheel to zoom
- ✅ Pinch gesture to zoom (trackpad/touch)
- ✅ MiniMap for navigation
- ✅ Click nodes/edges to select
- ✅ Controls panel buttons
- ✅ Fit view button

### ❌ Not Enabled

- ❌ Dragging individual nodes (nodes are fixed in layout positions)
- ❌ Multi-select with box selection
- ❌ Double-click to zoom
- ❌ Pan on scroll (vertical scroll = zoom instead)
- ❌ Connection creation (edges are defined in YAML)

## Settings Summary

Current ReactFlow configuration:

```javascript
panOnDrag: true          // ✅ Click and drag to pan
panOnScroll: false       // ❌ Scroll doesn't pan
zoomOnScroll: true       // ✅ Scroll to zoom
zoomOnPinch: true        // ✅ Pinch to zoom
zoomOnDoubleClick: false // ❌ No double-click zoom
minZoom: 0.2             // Zoom out to 20%
maxZoom: 1.8             // Zoom in to 180%
```

## Common Issues

### "Panning doesn't work"

**Possible causes:**

1. **Clicking on a node instead of empty space**
   - Solution: Click on the gray background between nodes

2. **Browser preventing drag events**
   - Solution: Try different browser
   - Chrome/Edge/Firefox all work well

3. **File being dragged over canvas**
   - Solution: Drop the file or move it away from canvas
   - File drop shows blue overlay

4. **Clicking on controls/panels**
   - Solution: Click only on the canvas area (middle panel)

### "Zoom is too sensitive"

**Solutions:**
- Use the `+`/`-` buttons instead of scroll wheel
- Use pinch gesture for finer control
- Use MiniMap for quick zoom-to-region

### "Can't see all nodes"

**Solutions:**
- Click the fit-view button (square icon in controls, bottom-left)
- Zoom out with mouse wheel
- Enable "include descendants" to see more of the hierarchy
- Switch to a different scope

### "Can't move individual nodes"

This is intentional. The layout algorithm positions nodes automatically based on the selected layout mode (horizontal, vertical, grid, auto-grid). Individual node dragging is disabled to maintain consistent layouts.

**Workaround:**
- Change the layout mode (top toolbar)
- Adjust which scope you're viewing

## Tips & Tricks

### Navigate Large Graphs

1. **Use MiniMap** - Quick overview and navigation
2. **Use Fit View** - Reset to see everything
3. **Zoom to Area** - Zoom in on specific region, then pan around
4. **Scope Selection** - View smaller subsets via scope dropdown

### Inspect Bindings

1. **Switch to Bindings View** - Shows interface handles
2. **Click an Edge** - See binding details in Inspector
3. **Follow Connections** - Pan to trace data flow

### Compare Layouts

1. **Try Different Layouts** - Horizontal, Vertical, Grid, Auto Grid
2. **Zoom Out** - See overall structure
3. **Zoom In** - Examine details

### Find Specific Nodes

1. **Use MiniMap** - Visual search
2. **Use Library Panel** - Left sidebar lists all blocks
3. **Use Scope Selector** - Navigate hierarchy

## Accessibility

### Keyboard-Only Navigation

Limited keyboard support currently. Recommended to use mouse/trackpad.

Future improvements may include:
- Arrow keys to pan
- +/- keys to zoom
- Tab to navigate nodes
- Enter to select

### Screen Readers

The canvas uses visual representation. For accessibility:
- Use the Inspector panel for text details
- Use the Library Panel for block listings
- Use the Problems Panel for validation info

## Browser Compatibility

### Best Performance

- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 15+

### Known Issues

- **Older browsers**: May have degraded performance with large graphs
- **Safari < 15**: File System Access API not supported (upload button won't work, use drag-drop)
- **Firefox on Linux**: Pinch zoom may not work on some trackpads

## Performance Tips

### For Large Graphs

1. **Disable descendants** - Uncheck "include descendants"
2. **Use scoping** - View smaller subsets
3. **Disable animations** - Validation view disables edge animations
4. **Use horizontal layout** - Often faster than grid for very large graphs

### For Smooth Interactions

1. **Close other tabs** - Free up browser resources
2. **Disable browser extensions** - Some extensions slow down canvas
3. **Use hardware acceleration** - Enable in browser settings
4. **Use modern browser** - Latest Chrome/Edge perform best

## Summary

**Basic interaction:**
- **Pan**: Click and drag empty space
- **Zoom**: Mouse wheel
- **Select**: Click nodes/edges
- **Reset view**: Fit-view button

**The canvas is fully interactive!** Click and drag anywhere on the gray background to move around.

If panning still doesn't work for you, please check:
1. Are you clicking on empty gray space (not on a node)?
2. Is there a file being dragged over the canvas?
3. Are you using a modern browser (Chrome/Edge/Firefox)?

The interface is designed to be intuitive - if something doesn't work as expected, it's likely a bug we should fix!
