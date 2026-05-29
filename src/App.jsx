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
  const [spacing, setSpacing] = useState(1.0);
  const [selection, setSelection] = useState(null);
  const [selectedBlockName, setSelectedBlockName] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFilename, setCurrentFilename] = useState("nearestprime.yaml");
  const [isDragging, setIsDragging] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const flow = useReactFlow();
  const { uploadFile, handleFileDrop, error: uploadError } = useFileUpload();

  useEffect(() => {
    // Check if there's a shared YAML in the URL hash
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = decodeURIComponent(hash);
        const decodedStr = atob(decoded);

        let payload;
        try {
          payload = JSON.parse(decodedStr);
        } catch (jsonError) {
          // Might be old format (plain YAML string, not JSON)
          payload = decodedStr;
        }

        // Check if it's the new format (object with yaml + settings) or old format (just yaml string)
        const yaml = typeof payload === 'string' ? payload : payload.yaml;

        console.info("[compose-flow] loaded shared content from URL", {
          hashLength: hash.length,
          decodedLength: decodedStr.length,
          yamlBytes: yaml.length,
          hasSettings: typeof payload === 'object'
        });

        setYamlText(yaml);
        const parsed = parseComposeYaml(yaml);
        setModel(parsed);

        // Restore view settings if present
        if (typeof payload === 'object' && payload.settings) {
          const s = payload.settings;
          if (s.view) setView(s.view);
          if (s.layoutMode) setLayoutMode(s.layoutMode);
          if (s.spacing !== undefined) setSpacing(s.spacing);
          if (s.showInterfaces !== undefined) setShowInterfaces(s.showInterfaces);
          if (s.showSuper !== undefined) setShowSuper(s.showSuper);
          if (s.includeDescendants !== undefined) setIncludeDescendants(s.includeDescendants);
          if (s.rootName) setRootName(s.rootName);
          if (s.scopeId) setScopeId(s.scopeId);
        } else {
          // Old format - use defaults
          setRootName(parsed.root);
          setScopeId(parsed.root);
        }

        setCurrentFilename("shared.yaml");
        setIsLoading(false);
        return;
      } catch (error) {
        console.error("[compose-flow] failed to parse shared content from URL", error);
        setLoadError(`Failed to load shared content from URL: ${error.message}`);
      }
    }

    // Load default example
    setIsLoading(true);
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}examples/nearestprime.yaml`)
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
    spacing,
  }), [graph, scopeId, view, includeDescendants, showInterfaces, showSuper, layoutMode, spacing]);

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
    const baseUrl = import.meta.env.BASE_URL;
    fetch(`${baseUrl}examples/example.yaml`)
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

  const handleShare = useCallback(() => {
    try {
      // Strip comments to reduce URL size
      // Remove full-line comments (lines that are only whitespace + # + comment)
      // and inline comments (trailing # comment on lines with content)
      const stripComments = (yaml) => {
        return yaml
          .split('\n')
          .map(line => {
            // Remove full-line comments
            if (line.trim().startsWith('#')) {
              return null;
            }
            // Remove inline comments (but preserve # in quoted strings - simple heuristic)
            // Only strip if # appears after some content and isn't in quotes
            const hashIndex = line.indexOf('#');
            if (hashIndex > 0) {
              const beforeHash = line.substring(0, hashIndex);
              // Simple check: if there are quotes before #, keep the line as-is
              const hasQuotes = beforeHash.includes('"') || beforeHash.includes("'");
              if (!hasQuotes) {
                return beforeHash.trimEnd();
              }
            }
            return line;
          })
          .filter(line => line !== null)
          .join('\n')
          .trim();
      };

      const yamlNoComments = stripComments(yamlText);

      const payload = {
        yaml: yamlNoComments,
        settings: {
          view,
          layoutMode,
          spacing,
          showInterfaces,
          showSuper,
          includeDescendants,
          rootName,
          scopeId,
        }
      };

      const jsonStr = JSON.stringify(payload);
      const encoded = btoa(jsonStr);
      const hash = encodeURIComponent(encoded);
      const url = `${window.location.origin}${window.location.pathname}#${hash}`;

      // Check URL length (most browsers support at least 2000 chars, modern browsers ~65k)
      const MAX_SAFE_URL_LENGTH = 16000; // Increased since we're stripping comments
      if (url.length > MAX_SAFE_URL_LENGTH) {
        const sizeKB = (url.length / 1024).toFixed(1);
        console.warn("[compose-flow] share URL is very long", {
          length: url.length,
          yamlOriginalSize: yamlText.length,
          yamlStrippedSize: yamlNoComments.length,
          reduction: `${((1 - yamlNoComments.length / yamlText.length) * 100).toFixed(1)}%`,
          encodedSize: encoded.length
        });
        setLoadError(`Share URL is too long (${sizeKB}KB). Try sharing a smaller YAML file or use the "Upload YAML" button to share the file directly.`);
        return;
      }

      // Update the current URL in the address bar
      window.history.pushState(null, "", `#${hash}`);

      navigator.clipboard.writeText(url).then(() => {
        console.info("[compose-flow] share URL copied to clipboard", {
          length: url.length,
          yamlOriginalSize: yamlText.length,
          yamlStrippedSize: yamlNoComments.length,
          commentsRemoved: `${((1 - yamlNoComments.length / yamlText.length) * 100).toFixed(1)}%`,
          settings: payload.settings
        });
        setShareSuccess(true);
        setTimeout(() => setShareSuccess(false), 3000);
      }).catch((error) => {
        console.error("[compose-flow] failed to copy to clipboard", error);
        // Fallback: show the URL in a prompt
        prompt("Share URL (copy manually):", url);
      });
    } catch (error) {
      console.error("[compose-flow] failed to generate share URL", error);
      setLoadError(`Failed to generate share URL: ${error.message}`);
    }
  }, [yamlText, view, layoutMode, spacing, showInterfaces, showSuper, includeDescendants, rootName, scopeId]);

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
          <button onClick={handleShare} className="share-button" aria-label="Generate shareable URL" disabled={isLoading}>
            {shareSuccess ? "✓ Copied!" : "Share"}
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
          <label>
            Spacing
            <div className="spacing-control">
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={spacing}
                onChange={(event) => setSpacing(parseFloat(event.target.value))}
                disabled={isLoading}
                aria-label="Adjust block spacing"
                className="spacing-slider"
              />
              <span className="spacing-value">{spacing.toFixed(1)}x</span>
            </div>
          </label>
        </div>
      </header>

      {isLoading && <div className="loading-banner">Loading sample YAML...</div>}
      {loadError && <div className="error-banner">{loadError}</div>}
      {uploadError && <div className="error-banner">{uploadError}</div>}
      {shareSuccess && <div className="success-banner">Share URL copied to clipboard!</div>}

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
              nodesDraggable={false}
              nodesConnectable={false}
              elementsSelectable={true}
              panOnDrag={[1, 2]}
              panOnScroll={false}
              zoomOnScroll={true}
              zoomOnPinch={true}
              zoomOnDoubleClick={false}
              selectionOnDrag={false}
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
