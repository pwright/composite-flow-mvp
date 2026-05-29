# Compose Flow MVP

React Flow MVP for visualising a Skupper VMS Compose-style YAML file.

The app focuses on making bindings consumable rather than drawing every possible relationship at once. It treats the model as:

- **Library blocks**: reusable `Block` definitions.
- **Instance blocks**: runtime instances created from composite bodies.
- **Interfaces**: visible ports on block cards.
- **Bindings**: edges between specific interfaces, including `super` bindings.
- **Generated resources**: resource chips extracted from simple block templates.
- **Validation notes**: role mismatch, missing interfaces, implicit polarity, max-binding checks, and TODO-style compatibility notes.

The bundled sample is `public/examples/nearestprime.yaml`, copied from the uploaded instance.

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

## Use the UI

### Loading Your Own YAML Files

You can load your own Compose YAML files in two ways:

1. **Upload Button**: Click the "Upload YAML" button in the top bar to select a file
2. **Drag and Drop**: Drag a YAML file from your file manager and drop it anywhere on the workspace

The app will automatically parse and visualize your file. The current filename is shown below the title.

### Recommended Workflow

1. Start with **View: landscape** and **Scope: nearestprime/container**.
2. Switch **Scope** to `nearestprime/container/mainApp` to inspect the app internals.
3. Switch **View** to **bindings** to show interface ports.
4. Click an edge to inspect the binding.
5. Use **resources** to see Kubernetes/Skupper generated resource chips.
6. Use **validation** to expose role/polarity/max-binding notes.

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

- Layout is deterministic but simple. Add ELK later if large graphs need crossing reduction.
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
