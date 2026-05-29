import { useCallback, useEffect, useMemo, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, ReactFlowProvider, useReactFlow } from "@xyflow/react";
import BlockNode from "./components/BlockNode.jsx";
import Inspector from "./components/Inspector.jsx";
import LibraryPanel from "./components/LibraryPanel.jsx";
import ProblemsPanel from "./components/ProblemsPanel.jsx";
import { deriveScopes, instantiateGraph, parseComposeYaml } from "./compose/composeModel.js";
import { makeFlowElements } from "./compose/flowElements.js";
import { useFileUpload } from "./hooks/useFileUpload.js";

const nodeTypes = { block: BlockNode };
const VIEWS = ["landscape", "bindings", "resources", "validation", "library"];

export default function App() {
  return (
    <ReactFlowProvider>
      <ComposeFlowApp />
    </ReactFlowProvider>
  );
}

function ComposeFlowApp() {
  const [yamlText, setYamlText] = useState("");
  const [model, setModel] = useState(null);
  const [rootName, setRootName] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [view, setView] = useState("landscape");
  const [includeDescendants, setIncludeDescendants] = useState(false);
  const [showInterfaces, setShowInterfaces] = useState(false);
  const [showSuper, setShowSuper] = useState(true);
  const [layoutMode, setLayoutMode] = useState("auto-grid");
  const [selection, setSelection] = useState(null);
  const [selectedBlockName, setSelectedBlockName] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilename, setCurrentFilename] = useState("nearestprime.yaml");
  const [isDragging, setIsDragging] = useState(false);
  const flow = useReactFlow();
  const { uploadFile, handleFileDrop, error: uploadError } = useFileUpload();

  useEffect(() => {
    setIsLoading(true);
    fetch("/examples/nearestprime.yaml")
      .then((response) => response.text())
      .then((text) => {
        console.info("[compose-flow] loaded bundled sample YAML", { bytes: text.length });
        setYamlText(text);
        const parsed = parseComposeYaml(text);
        setModel(parsed);
        setRootName(parsed.root);
        setScopeId(parsed.root);
      })
      .catch((error) => {
        console.error("[compose-flow] failed to load sample", error);
        setLoadError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const graph = useMemo(() => {
    if (!model) {
      return { root: null, blocks: [], instances: [], bindings: [], problems: [] };
    }
    return instantiateGraph(model, rootName || model.root);
  }, [model, rootName]);

  const scopes = useMemo(() => deriveScopes(graph), [graph]);

  useEffect(() => {
    if (!scopeId && graph.root) {
      setScopeId(graph.root);
    }
  }, [graph.root, scopeId]);

  const elements = useMemo(() => makeFlowElements(graph, {
    scopeId: scopeId || graph.root,
    view,
    includeDescendants,
    showInterfaces: showInterfaces || view === "bindings" || view === "validation",
    showResources: view === "resources",
    showSuper,
    layoutMode,
  }), [graph, scopeId, view, includeDescendants, showInterfaces, showSuper, layoutMode]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        flow.fitView({ padding: 0.16, duration: 250 });
      } catch (error) {
        console.warn("[compose-flow] fitView skipped", error);
      }
    }, 100);
    return () => window.clearTimeout(timer);
  }, [elements, flow]);

  const applyYaml = useCallback(() => {
    try {
      console.info("[compose-flow] applying YAML from editor");
      const parsed = parseComposeYaml(yamlText);
      setModel(parsed);
      setRootName(parsed.root);
      setScopeId(parsed.root);
      setSelection(null);
      setLoadError(null);
    } catch (error) {
      console.error("[compose-flow] failed to apply YAML", error);
      setLoadError(error.message);
    }
  }, [yamlText]);

  const loadYamlFile = useCallback((text, filename) => {
    console.info("[compose-flow] loading file", { filename, bytes: text.length });
    setYamlText(text);
    setCurrentFilename(filename);
    try {
      const parsed = parseComposeYaml(text);
      setModel(parsed);
      setRootName(parsed.root);
      setScopeId(parsed.root);
      setSelection(null);
      setLoadError(null);
    } catch (error) {
      console.error("[compose-flow] failed to parse YAML", error);
      setLoadError(error.message);
    }
  }, []);

  const handleUploadClick = useCallback(async () => {
    const result = await uploadFile();
    if (result) {
      loadYamlFile(result.text, result.filename);
    }
  }, [uploadFile, loadYamlFile]);

  const handleLoadExample = useCallback(() => {
    setIsLoading(true);
    fetch("/examples/example.yaml")
      .then((response) => response.text())
      .then((text) => {
        loadYamlFile(text, "example.yaml");
      })
      .catch((error) => {
        console.error("[compose-flow] failed to load example", error);
        setLoadError(error.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [loadYamlFile]);

  const onDrop = useCallback(async (event) => {
    setIsDragging(false);
    const result = await handleFileDrop(event);
    if (result) {
      loadYamlFile(result.text, result.filename);
    }
  }, [handleFileDrop, loadYamlFile]);

  const onDragOver = useCallback((event) => {
    // Only handle file drops, not ReactFlow panning
    if (event.dataTransfer.types && event.dataTransfer.types.includes('Files')) {
      event.preventDefault();
      setIsDragging(true);
    }
  }, []);

  const onDragLeave = useCallback((event) => {
    if (event.currentTarget === event.target) {
      setIsDragging(false);
    }
  }, []);

  const selectedBlock = useMemo(() => graph.blocks.find((block) => block.name === selectedBlockName), [graph.blocks, selectedBlockName]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Compose Flow MVP</h1>
          <p>Visualise blocks, composite scopes, interfaces, bindings, generated resources, and validation notes.</p>
          <p className="current-file">Current file: {currentFilename}</p>
        </div>
        <div className="topbar__controls">
          <button onClick={handleLoadExample} className="example-button" aria-label="Load invoice platform example" disabled={isLoading}>
            Load Complex Example
          </button>
          <button onClick={handleUploadClick} className="upload-button" aria-label="Upload YAML file">
            Upload YAML
          </button>
          <label>
            Root
            <select value={rootName ?? ""} onChange={(event) => setRootName(event.target.value)} disabled={isLoading} aria-label="Select root block">
              {graph.blocks.map((block) => <option key={block.name} value={block.name}>{block.name}</option>)}
            </select>
          </label>
          <label>
            Scope
            <select value={scopeId ?? ""} onChange={(event) => setScopeId(event.target.value)} disabled={isLoading} aria-label="Select scope">
              {scopes.map((scope) => <option key={scope.id} value={scope.id}>{scope.label}</option>)}
            </select>
          </label>
          <label>
            View
            <select value={view} onChange={(event) => setView(event.target.value)} disabled={isLoading} aria-label="Select view mode">
              {VIEWS.map((viewName) => <option key={viewName} value={viewName}>{viewName}</option>)}
            </select>
          </label>
          <label>
            Layout
            <select value={layoutMode} onChange={(event) => setLayoutMode(event.target.value)} disabled={isLoading} aria-label="Select layout mode">
              <option value="horizontal">Horizontal</option>
              <option value="vertical">Vertical</option>
              <option value="grid">Grid (3 cols)</option>
              <option value="auto-grid">Auto Grid</option>
            </select>
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={includeDescendants} onChange={(event) => setIncludeDescendants(event.target.checked)} disabled={isLoading} aria-label="Include descendants in view" />
            include descendants
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={showInterfaces} onChange={(event) => setShowInterfaces(event.target.checked)} disabled={isLoading} aria-label="Force display of interfaces" />
            force interfaces
          </label>
          <label className="checkbox">
            <input type="checkbox" checked={showSuper} onChange={(event) => setShowSuper(event.target.checked)} disabled={isLoading} aria-label="Show super bindings" />
            super bindings
          </label>
        </div>
      </header>

      {isLoading && <div className="loading-banner">Loading sample YAML...</div>}
      {loadError && <div className="error-banner">{loadError}</div>}
      {uploadError && <div className="error-banner">{uploadError}</div>}

      <main className={`workspace ${isDragging ? "is-dragging" : ""}`} onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}>
        <LibraryPanel blocks={graph.blocks} selectedBlockName={selectedBlockName} onSelectBlock={setSelectedBlockName} />

        <section className="canvas-panel">
          {view === "library" ? (
            <LibraryDetail block={selectedBlock ?? graph.blocks[0]} />
          ) : (
            <ReactFlow
              nodes={elements.nodes}
              edges={elements.edges}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.2}
              maxZoom={1.8}
              panOnDrag={true}
              panOnScroll={false}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={false}
              onNodeClick={(_, node) => {
                console.info("[compose-flow] selected node", node.data);
                setSelection({ type: "node", data: node.data });
              }}
              onEdgeClick={(_, edge) => {
                console.info("[compose-flow] selected edge", edge.data);
                setSelection({ type: "edge", data: edge.data });
              }}
              onPaneClick={() => setSelection(null)}
            >
              <Background />
              <Controls />
              <MiniMap pannable zoomable />
            </ReactFlow>
          )}
        </section>

        <Inspector selection={selection} graph={graph} />
      </main>

      <section className="bottom-panel">
        <details>
          <summary>YAML input</summary>
          <div className="yaml-editor">
            <textarea value={yamlText} onChange={(event) => setYamlText(event.target.value)} aria-label="YAML input editor" />
            <button onClick={applyYaml} aria-label="Apply YAML changes">Apply YAML</button>
          </div>
        </details>
        <ProblemsPanel problems={graph.problems} />
      </section>
    </div>
  );
}

function LibraryDetail({ block }) {
  if (!block) {
    return <div className="library-detail">No block selected.</div>;
  }

  return (
    <div className="library-detail">
      <h2>{block.name}</h2>
      <p>{block.type} · {block.bodyStyle}</p>
      <h3>Interfaces</h3>
      <table>
        <thead>
          <tr><th>Name</th><th>Role</th><th>Polarity</th><th>Max</th></tr>
        </thead>
        <tbody>
          {block.interfaces.map((iface) => (
            <tr key={iface.name}>
              <td>{iface.name}</td>
              <td>{iface.role}</td>
              <td>{iface.polarity ?? "implicit"}</td>
              <td>{String(iface.maxBindings)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Config schema</h3>
      <pre className="json-block">{JSON.stringify(block.configSchema, null, 2)}</pre>
      <h3>Generated resources</h3>
      <ul>
        {block.generatedResources.map((resource) => <li key={resource.id}>{resource.apiVersion} / {resource.kind}</li>)}
      </ul>
    </div>
  );
}
