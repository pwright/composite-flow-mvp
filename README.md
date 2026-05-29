# Compose Flow MVP

[![Deploy to GitHub Pages](https://github.com/YOUR-USERNAME/compose-flow-mvp/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR-USERNAME/compose-flow-mvp/actions/workflows/deploy.yml)

React Flow MVP for visualising a Skupper VMS Compose-style YAML file.

The app focuses on making bindings consumable rather than drawing every possible relationship at once. It treats the model as:

- **Library blocks**: reusable `Block` definitions.
- **Instance blocks**: runtime instances created from composite bodies.
- **Interfaces**: visible ports on block cards.
- **Bindings**: edges between specific interfaces, including `super` bindings.
- **Generated resources**: resource chips extracted from simple block templates.
- **Validation notes**: role mismatch, missing interfaces, implicit polarity, max-binding checks, and TODO-style compatibility notes.

The bundled sample is `public/examples/nearestprime.yaml`, copied from the uploaded instance. An additional comprehensive example is available in `example.yaml` - see `example.md` for detailed documentation of this invoice processing platform use case.

## Why React Flow

React Flow is used because this UI needs custom cards, handles/ports, grouped nodes, selectable edges, and interactive scope changes. The MVP intentionally avoids a full all-edges-at-once topology view because that becomes unreadable quickly.

## Requirements

- Node.js 20 or newer recommended
- npm
- `just`, optional but recommended

## Run

```sh
npm install
npm run dev
```

Or with `just`:

```sh
just install
just dev
```

Open the Vite URL shown in the terminal.

## Build

```sh
npm run build
npm run preview
```

## Deploy to GitHub Pages

This project includes a GitHub Actions workflow for automatic deployment to GitHub Pages.

**Quick setup:**
1. Enable GitHub Pages in repository settings (Settings → Pages → Source: GitHub Actions)
2. Push to `main` branch
3. Site will be live at `https://<username>.github.io/compose-flow-mvp/`

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## Use the UI

### Navigation

- **Pan**: Click and drag on empty canvas space to move around
- **Zoom**: Use mouse wheel or pinch gesture
- **Fit View**: Click the fit-view button in controls (bottom-left)
- **MiniMap**: Use the mini-map (bottom-right) for overview and quick navigation

See [INTERACTION_GUIDE.md](INTERACTION_GUIDE.md) for detailed interaction documentation.

### Loading YAML Files

You can load Compose YAML files in three ways:

1. **Load Complex Example**: Click the "Load Complex Example" button to load the comprehensive invoice platform example (12 blocks, 24 instances, 23 bindings)
2. **Upload Button**: Click the "Upload YAML" button in the top bar to select a file from your computer
3. **Drag and Drop**: Drag a YAML file from your file manager and drop it anywhere on the workspace

The app will automatically parse and visualize your file. The current filename is shown below the title.

**Bundled Examples:**
- `nearestprime.yaml` - Simple example (default on load)
- `example.yaml` - Complex invoice processing platform (click "Load Complex Example" button)

### Recommended Workflow

1. Start with **View: landscape** and **Scope: nearestprime/container**.
2. Switch **Scope** to `nearestprime/container/mainApp` to inspect the app internals.
3. Switch **View** to **bindings** to show interface ports.
4. Click an edge to inspect the binding.
5. Use **resources** to see Kubernetes/Skupper generated resource chips.
6. Use **validation** to expose role/polarity/max-binding notes.
7. Try different **Layout** options:
   - **Auto Grid** - Adaptive square grid (default)
   - **Horizontal** - Left-to-right flow
   - **Vertical** - Top-to-bottom flow
   - **Grid (3 cols)** - Fixed 3-column grid
8. Adjust **Spacing** slider (0.5x - 2.0x) to control distance between blocks

The default is deliberately scoped. Enable **include descendants** only when you need a deeper view.

## CLI normalizer

The CLI accepts file input or stdin, writes JSON to stdout by default, and logs diagnostics to stderr.

```sh
node scripts/compose-to-flow.mjs public/examples/nearestprime.yaml > flow.json
cat public/examples/nearestprime.yaml | node scripts/compose-to-flow.mjs - > flow.json
node scripts/compose-to-flow.mjs public/examples/nearestprime.yaml -o flow.json
```

Use a specific root block:

```sh
node scripts/compose-to-flow.mjs public/examples/nearestprime.yaml --root nearestprime/main > main-flow.json
```

## Golden test workflow

```sh
npm run export:sample
npm run test:normalizer
```

The test compares the normalized graph against `tests/golden/nearestprime-flow.json`.

## Project layout

```text
.
├── public/examples/nearestprime.yaml     # sample Compose YAML
├── src/App.jsx                           # app shell and controls
├── src/components/BlockNode.jsx          # React Flow block/card node
├── src/components/Inspector.jsx          # selected block/binding details
├── src/components/LibraryPanel.jsx       # library block catalog
├── src/components/ProblemsPanel.jsx      # validation notes
├── src/compose/composeModel.js           # parser, instantiator, validator
├── src/compose/flowElements.js           # graph-to-React-Flow conversion
├── scripts/compose-to-flow.mjs           # pipe-friendly CLI normalizer
├── scripts/test-normalizer.mjs           # golden test runner
├── tests/golden/nearestprime-flow.json   # expected normalized graph
├── docs-source-model.md                  # copied first/reference doc
├── justfile
└── package.json
```

## Features

- ✅ Error boundary with graceful error handling
- ✅ Loading states for better UX
- ✅ File upload via button or drag-and-drop
- ✅ Code splitting for optimized bundle size
- ✅ Accessibility improvements with ARIA labels
- ✅ Visual drag-and-drop feedback

## Known limitations

- Layout algorithms are simple (horizontal, vertical, grid). Add ELK later if large graphs need crossing reduction or advanced auto-layout.
- Polarity is reported as implicit when the YAML omits it. The MVP does not infer the project runtime defaults.
- Block-type compatibility is intentionally reported as an info note because the source model treats it as a TODO.
- Template rendering is not executed. Generated resources are extracted from template text by scanning for `apiVersion` and `kind`.
- The app does not currently persist manual node positions.
- File System Access API (upload button) requires modern browsers (Chrome/Edge 86+, Safari 15.2+). Drag-and-drop works everywhere.

## Next useful increments

- Add an ELK layout button.
- Add a binding table that highlights paths on hover.
- Add collapse/expand controls for composite nodes.
- Render `super` bindings with a distinct containment-boundary glyph.
- Add a generated YAML preview for a selected instance.
- Add a file-open workflow using the File System Access API.
