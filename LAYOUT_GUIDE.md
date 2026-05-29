# Layout Options Guide

The Compose Flow MVP now supports four different layout algorithms for visualizing your block hierarchies. Each layout mode organizes child nodes differently within their parent composite blocks.

## Available Layout Modes

### 1. Horizontal

**Best for:** Wide, shallow hierarchies with few children per level

All child nodes are arranged in a single horizontal row, left to right.

```
┌─ Parent ───────────────────────────────────────┐
│                                                 │
│  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  │
│  │ A   │  │ B   │  │ C   │  │ D   │  │ E   │  │
│  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Pros:**
- Clear left-to-right flow
- Good for showing sequential processes
- Minimal vertical space usage

**Cons:**
- Very wide layouts with many children
- Can require horizontal scrolling
- Poor use of vertical space

**Use cases:**
- Pipeline architectures (API → Service → DB)
- Sequential workflows
- Blocks with 2-5 children

---

### 2. Vertical

**Best for:** Tall, narrow hierarchies; top-down flows

All child nodes are arranged in a single vertical column, top to bottom.

```
┌─ Parent ────┐
│             │
│  ┌─────┐   │
│  │ A   │   │
│  └─────┘   │
│             │
│  ┌─────┐   │
│  │ B   │   │
│  └─────┘   │
│             │
│  ┌─────┐   │
│  │ C   │   │
│  └─────┘   │
│             │
│  ┌─────┐   │
│  │ D   │   │
│  └─────┘   │
│             │
└─────────────┘
```

**Pros:**
- Minimal horizontal space usage
- Good for hierarchical/org-chart structures
- Natural top-down reading order

**Cons:**
- Very tall layouts with many children
- Can require vertical scrolling
- Poor use of horizontal space

**Use cases:**
- Organizational hierarchies
- Top-down decision trees
- Blocks with many children (6+)
- Narrow display areas

---

### 3. Grid (3 columns)

**Best for:** Medium-sized sets of children (6-15); balanced layouts

Child nodes are arranged in a fixed 3-column grid, filling rows left to right.

```
┌─ Parent ───────────────────────────────┐
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ A   │  │ B   │  │ C   │            │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ D   │  │ E   │  │ F   │            │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
│  ┌─────┐  ┌─────┐  ┌─────┐            │
│  │ G   │  │ H   │  │ I   │            │
│  └─────┘  └─────┘  └─────┘            │
│                                         │
└─────────────────────────────────────────┘
```

**Pros:**
- Balanced horizontal and vertical space usage
- Predictable column width
- Good for dashboards and overview displays

**Cons:**
- May have empty cells in last row
- Fixed 3-column width may not suit all content
- Not adaptive to child count

**Use cases:**
- Microservices dashboards
- Component catalogs
- Blocks with 6-12 children
- When you want consistent column alignment

---

### 4. Auto Grid (Default)

**Best for:** Any number of children; most adaptive layout

Child nodes are arranged in a grid with automatically calculated columns based on child count. Uses a square-root heuristic to create roughly square grids.

Examples:

**4 children → 2x2 grid:**
```
┌─ Parent ─────────────────┐
│                           │
│  ┌─────┐  ┌─────┐        │
│  │ A   │  │ B   │        │
│  └─────┘  └─────┘        │
│                           │
│  ┌─────┐  ┌─────┐        │
│  │ C   │  │ D   │        │
│  └─────┘  └─────┘        │
│                           │
└───────────────────────────┘
```

**9 children → 3x3 grid:**
```
┌─ Parent ───────────────────────────┐
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │ A   │  │ B   │  │ C   │        │
│  └─────┘  └─────┘  └─────┘        │
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │ D   │  │ E   │  │ F   │        │
│  └─────┘  └─────┘  └─────┘        │
│                                     │
│  ┌─────┐  ┌─────┐  ┌─────┐        │
│  │ G   │  │ H   │  │ I   │        │
│  └─────┘  └─────┘  └─────┘        │
│                                     │
└─────────────────────────────────────┘
```

**16 children → 4x4 grid:**
```
┌─ Parent ──────────────────────────────────────┐
│                                                │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐              │
│  │ A  │  │ B  │  │ C  │  │ D  │              │
│  └────┘  └────┘  └────┘  └────┘              │
│                                                │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐              │
│  │ E  │  │ F  │  │ G  │  │ H  │              │
│  └────┘  └────┘  └────┘  └────┘              │
│                                                │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐              │
│  │ I  │  │ J  │  │ K  │  │ L  │              │
│  └────┘  └────┘  └────┘  └────┘              │
│                                                │
│  ┌────┐  ┌────┐  ┌────┐  ┌────┐              │
│  │ M  │  │ N  │  │ O  │  │ P  │              │
│  └────┘  └────┘  └────┘  └────┘              │
│                                                │
└────────────────────────────────────────────────┘
```

**Pros:**
- Adapts to any number of children
- Roughly square/balanced grids
- Good default for unknown child counts
- Scales well from 4 to 100+ children

**Cons:**
- Column count varies by scope
- Less predictable than fixed grid
- May have empty cells in last row

**Use cases:**
- General-purpose layout
- Dynamic content with varying child counts
- Large composite blocks (15+ children)
- When you want automatic optimal spacing

**Algorithm:** `columns = ceil(sqrt(childCount))`
- 1 child → 1x1
- 2-3 children → 2 columns
- 4-8 children → 3 columns
- 9-15 children → 4 columns
- 16-24 children → 5 columns
- etc.

---

## Choosing the Right Layout

| Child Count | Recommended Layout | Alternative |
|-------------|-------------------|-------------|
| 1-2 | Horizontal | Vertical |
| 3-5 | Horizontal | Auto Grid |
| 6-9 | Auto Grid | Grid (3 cols) |
| 10-15 | Auto Grid | Vertical |
| 16+ | Auto Grid | Vertical |

## Layout Behavior Notes

### Nested Layouts

Each composite block applies its own layout algorithm to its children. This means:

- Parent block: Horizontal layout
  - Child block A (composite): Vertical layout for its children
  - Child block B (composite): Grid layout for its children

The layout setting is **per-scope**, not global. When you switch scope, the same layout algorithm applies to the new scope's children.

### Leaf Nodes

Leaf nodes (blocks with no children) always render at their fixed size:
- Width: 300px
- Height: 180px (minimum)

### Composite Nodes

Composite blocks size themselves based on their children and the layout algorithm:
- Width/Height expand to fit all children
- Minimum width: 360px
- Minimum height: 260px

### Performance

All layout modes have O(n) performance where n = number of visible nodes. There is no practical difference in performance between layout modes for typical graphs (<1000 nodes).

## Example: Invoice Platform

For the `example.yaml` invoice platform:

**invoice-platform scope (9 children):**
- **Horizontal:** Very wide (requires scrolling)
- **Vertical:** Tall, compact width
- **Grid (3 cols):** 3x3 grid, balanced
- **Auto Grid:** 3x3 grid (9 children → sqrt(9) = 3)

**invoice-platform/stock scope (4 children):**
- **Horizontal:** service, db, store, svc-to-db in a row
- **Vertical:** service, db, store, svc-to-db in a column
- **Grid (3 cols):** 2 rows (4 children, 3 per row)
- **Auto Grid:** 2x2 grid (4 children → sqrt(4) = 2)

## Tips

1. **Start with Auto Grid** - It adapts well to any child count
2. **Use Horizontal for pipelines** - API → Service → DB flows
3. **Use Vertical for hierarchies** - Top-down organizational charts
4. **Switch layouts per scope** - Different scopes may benefit from different layouts
5. **Try all options** - It's a dropdown, experiment!

## Future Enhancements

Possible future additions:
- **Dagre layout** - Hierarchical directed graph layout
- **ELK layout** - Advanced auto-layout with crossing reduction
- **Force-directed layout** - Physics-based node placement
- **Circular layout** - Nodes arranged in a circle
- **Custom layout** - Drag-and-drop manual positioning
- **Per-scope layout memory** - Remember layout choice per scope
- **Layout hints in YAML** - Specify preferred layout in block metadata

## Summary

The layout system provides flexibility in how you visualize your block hierarchies:

- **Horizontal** - Classic left-to-right flow
- **Vertical** - Top-down hierarchy
- **Grid (3 cols)** - Fixed 3-column grid
- **Auto Grid** - Adaptive square grids

Choose the layout that best suits your content and display constraints. The layout selector is in the top toolbar, next to the View selector.
