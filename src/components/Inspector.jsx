export default function Inspector({ selection, graph }) {
  if (!selection) {
    return (
      <aside className="inspector">
        <h2>Inspector</h2>
        <p>Select a block or binding edge to inspect its model data.</p>
        <Summary graph={graph} />
      </aside>
    );
  }

  if (selection.type === "edge") {
    const binding = selection.data?.binding;
    return (
      <aside className="inspector">
        <h2>Binding</h2>
        <dl>
          <dt>Kind</dt><dd>{binding?.kind}</dd>
          <dt>Scope</dt><dd>{binding?.scopeId}</dd>
          <dt>From</dt><dd>{binding?.source?.instanceId}.{binding?.source?.interfaceName}</dd>
          <dt>To</dt><dd>{binding?.target?.instanceId}.{binding?.target?.interfaceName}</dd>
        </dl>
        <JsonBlock value={binding} />
      </aside>
    );
  }

  const data = selection.data;
  return (
    <aside className="inspector">
      <h2>{data.name}</h2>
      <dl>
        <dt>Block</dt><dd>{data.blockName}</dd>
        <dt>Type</dt><dd>{data.blockType}</dd>
        <dt>Body style</dt><dd>{data.bodyStyle}</dd>
        <dt>Site classes</dt><dd>{data.siteClasses?.join(", ") || "—"}</dd>
      </dl>

      <h3>Interfaces</h3>
      <ul className="inspector-list">
        {(data.interfaces ?? []).map((iface) => (
          <li key={iface.name}>
            <strong>{iface.name}</strong> <span>{iface.role}</span>
            {iface.polarity ? <em>{iface.polarity}</em> : <em>implicit polarity</em>}
          </li>
        ))}
      </ul>

      <h3>Config</h3>
      <JsonBlock value={data.config ?? {}} />

      <h3>Generated resources</h3>
      <ul className="inspector-list">
        {(data.generatedResources ?? []).map((resource) => (
          <li key={resource.id}>{resource.apiVersion} / <strong>{resource.kind}</strong></li>
        ))}
      </ul>
    </aside>
  );
}

function Summary({ graph }) {
  return (
    <section className="summary-box">
      <div><strong>{graph.blocks.length}</strong><span>library blocks</span></div>
      <div><strong>{graph.instances.length}</strong><span>instances</span></div>
      <div><strong>{graph.bindings.length}</strong><span>bindings</span></div>
      <div><strong>{graph.problems.length}</strong><span>problems/info</span></div>
    </section>
  );
}

function JsonBlock({ value }) {
  return <pre className="json-block">{JSON.stringify(value, null, 2)}</pre>;
}
