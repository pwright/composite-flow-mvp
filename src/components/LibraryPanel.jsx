export default function LibraryPanel({ blocks, selectedBlockName, onSelectBlock }) {
  return (
    <aside className="library-panel">
      <h2>Library blocks</h2>
      <p className="muted">Reusable block definitions from the YAML.</p>
      <div className="library-list">
        {blocks.map((block) => (
          <button
            key={block.name}
            className={block.name === selectedBlockName ? "library-item is-selected" : "library-item"}
            onClick={() => {
              console.info("[compose-flow] library block selected", block);
              onSelectBlock(block.name);
            }}
          >
            <strong>{block.name}</strong>
            <span>{block.type.replace("skupperx.io/", "")} · {block.bodyStyle}</span>
            <small>{block.interfaces.length} interfaces · {block.generatedResources.length} resources</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
