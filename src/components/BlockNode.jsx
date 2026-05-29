import { Handle, Position } from "@xyflow/react";
import { sourceHandleId, targetHandleId } from "../compose/flowElements.js";

export default function BlockNode({ data, selected }) {
  const interfaces = data.interfaces ?? [];
  const resources = data.generatedResources ?? [];
  const isComposite = data.bodyStyle === "composite";

  return (
    <div className={["block-node", isComposite ? "block-node--composite" : "", selected ? "is-selected" : ""].join(" ")}> 
      <header className="block-node__header">
        <div>
          <div className="block-node__name">{data.name}</div>
          <div className="block-node__block">{data.blockName}</div>
        </div>
        <span className={`badge badge--${slug(data.bodyStyle)}`}>{data.bodyStyle}</span>
      </header>

      <div className="block-node__meta">
        <span className="chip">{shortType(data.blockType)}</span>
        {(data.siteClasses ?? []).map((siteClass) => <span className="chip chip--site" key={siteClass}>{siteClass}</span>)}
        {Object.keys(data.config ?? {}).map((key) => <span className="chip chip--config" key={key}>{key}: {String(data.config[key])}</span>)}
      </div>

      {data.showInterfaces && interfaces.length > 0 && (
        <div className="interfaces">
          {interfaces.map((iface, index) => (
            <div className="interface-row" key={iface.name} style={{ top: `${48 + index * 34}px` }}>
              <Handle
                id={targetHandleId(iface.name)}
                type="target"
                position={Position.Left}
                className="interface-handle interface-handle--target"
                style={{ top: `${48 + index * 34}px` }}
              />
              <span className="interface-name">{iface.name}</span>
              <span className="interface-role">{iface.role}</span>
              <Handle
                id={sourceHandleId(iface.name)}
                type="source"
                position={Position.Right}
                className="interface-handle interface-handle--source"
                style={{ top: `${48 + index * 34}px` }}
              />
            </div>
          ))}
        </div>
      )}

      {data.showResources && resources.length > 0 && (
        <div className="resource-chips">
          {resources.map((resource) => (
            <span className="chip chip--resource" key={resource.id}>{resource.kind}</span>
          ))}
        </div>
      )}

      {data.compact && !data.showInterfaces && (
        <div className="block-node__summary">
          {interfaces.length} interfaces · {resources.length} generated resources
        </div>
      )}
    </div>
  );
}

function shortType(type) {
  return type?.replace("skupperx.io/", "") ?? "unknown";
}

function slug(value) {
  return String(value ?? "unknown").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}
