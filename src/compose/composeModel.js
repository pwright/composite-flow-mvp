import YAML from "yaml";

const DEFAULT_ROOT_TYPE = "skupperx.io/toplevel";

export function parseComposeYaml(text) {
  console.info("[compose-flow] parsing YAML input", { bytes: text.length });

  const documents = YAML.parseAllDocuments(text)
    .map((doc, index) => {
      if (doc.errors?.length) {
        console.error("[compose-flow] YAML parse errors", { index, errors: doc.errors });
        throw new Error(`YAML document ${index + 1} has parse errors: ${doc.errors.map((e) => e.message).join("; ")}`);
      }
      return doc.toJSON();
    })
    .filter(Boolean);

  const blocks = new Map();
  for (const item of documents) {
    if (item?.kind !== "Block" || !item?.metadata?.name) {
      console.warn("[compose-flow] skipping non-Block document", item);
      continue;
    }

    const block = normalizeBlock(item);
    if (blocks.has(block.name)) {
      console.warn("[compose-flow] replacing duplicate block definition", { name: block.name });
    }
    blocks.set(block.name, block);
  }

  const root = [...blocks.values()].find((block) => block.type === DEFAULT_ROOT_TYPE)?.name
    ?? [...blocks.keys()].at(-1)
    ?? null;

  const model = {
    apiVersion: documents.find((item) => item?.apiVersion)?.apiVersion ?? null,
    blocks,
    root,
  };

  console.info("[compose-flow] parsed compose model", {
    blockCount: blocks.size,
    root,
  });

  return model;
}

function normalizeBlock(item) {
  const spec = item.spec ?? {};
  const body = spec.body ?? (spec.bodyStyle === "composite" ? {} : []);
  return {
    name: item.metadata.name,
    type: item.type ?? "unknown",
    apiVersion: item.apiVersion,
    annotations: item.metadata.annotations ?? {},
    bodyStyle: spec.bodyStyle ?? "simple",
    configSchema: spec.config ?? {},
    interfaces: normalizeInterfaces(spec.interfaces ?? {}, item.metadata.name),
    body,
    generatedResources: extractGeneratedResources(body),
    raw: item,
  };
}

function normalizeInterfaces(interfaces, blockName) {
  return Object.entries(interfaces).map(([name, spec]) => ({
    id: `${blockName}.${name}`,
    name,
    role: spec?.role ?? "unknown",
    polarity: spec?.polarity ?? null,
    blockType: spec?.blockType ?? blockName,
    maxBindings: spec?.maxBindings ?? 1,
    data: spec?.data ?? {},
  }));
}

function extractGeneratedResources(body) {
  if (!Array.isArray(body)) {
    return [];
  }

  const resources = [];
  for (const [bodyIndex, section] of body.entries()) {
    const template = section?.template;
    if (!template) {
      continue;
    }

    const docs = template.split(/^---\s*$/m).map((part) => part.trim()).filter(Boolean);
    for (const [docIndex, doc] of docs.entries()) {
      const apiVersion = doc.match(/^\s*apiVersion:\s*([^\n]+)/m)?.[1]?.trim() ?? "template";
      const kind = doc.match(/^\s*kind:\s*([^\n]+)/m)?.[1]?.trim() ?? "Unknown";
      resources.push({
        id: `body-${bodyIndex}-doc-${docIndex}`,
        apiVersion,
        kind,
        affinity: toArray(section.affinity),
        targetPlatforms: toArray(section.targetPlatforms),
        description: section.description ?? "",
      });
    }
  }
  return resources;
}

export function instantiateGraph(model, rootName = model.root) {
  if (!rootName) {
    return emptyGraph("No root block found");
  }

  if (!model.blocks.has(rootName)) {
    return emptyGraph(`Root block ${rootName} not found`);
  }

  console.info("[compose-flow] instantiating graph", { rootName });

  const instances = new Map();
  const bindings = [];
  const problems = [];

  const instantiate = (blockName, instanceName, id, parentId, childSpec = {}, depth = 0) => {
    const block = model.blocks.get(blockName);
    if (!block) {
      problems.push(problem("error", "missing-block", `Missing library block: ${blockName}`, { blockName, id }));
      return null;
    }

    const instance = {
      id,
      name: instanceName,
      blockName,
      blockType: block.type,
      bodyStyle: block.bodyStyle,
      parentId,
      depth,
      config: childSpec.config ?? {},
      configSchema: block.configSchema,
      siteClasses: toArray(childSpec.siteClasses),
      interfaces: block.interfaces.map((iface) => ({
        ...iface,
        id: `${id}.${iface.name}`,
        instanceId: id,
      })),
      generatedResources: block.generatedResources,
    };

    instances.set(id, instance);

    if (block.bodyStyle === "composite" && block.body && typeof block.body === "object" && !Array.isArray(block.body)) {
      for (const [childName, child] of Object.entries(block.body)) {
        if (!child?.block) {
          problems.push(problem("error", "invalid-child", `Composite item ${childName} is missing block`, { parentId: id }));
          continue;
        }
        instantiate(child.block, childName, makeChildId(id, childName), id, child, depth + 1);
      }
    }

    return instance;
  };

  const makeBindings = (blockName, id) => {
    const block = model.blocks.get(blockName);
    if (!block || block.bodyStyle !== "composite" || !block.body || Array.isArray(block.body)) {
      return;
    }

    for (const [childName, child] of Object.entries(block.body)) {
      const childId = makeChildId(id, childName);
      if (child?.bindings) {
        for (const [interfaceName, binding] of Object.entries(child.bindings)) {
          if (binding?.super) {
            bindings.push({
              id: `super:${childId}.${interfaceName}->${id}.${binding.super}`,
              kind: "super",
              scopeId: id,
              source: { instanceId: id, interfaceName: binding.super },
              target: { instanceId: childId, interfaceName },
              label: `super ${binding.super} → ${interfaceName}`,
            });
          } else if (binding?.block && binding?.blockInterface) {
            const targetId = makeChildId(id, binding.block);
            bindings.push({
              id: `binding:${childId}.${interfaceName}->${targetId}.${binding.blockInterface}`,
              kind: "binding",
              scopeId: id,
              source: { instanceId: childId, interfaceName },
              target: { instanceId: targetId, interfaceName: binding.blockInterface },
              label: `${interfaceName} → ${binding.blockInterface}`,
            });
          } else {
            problems.push(problem("error", "invalid-binding", `Invalid binding on ${childId}.${interfaceName}`, { childId, interfaceName, binding }));
          }
        }
      }

      const childBlockName = child?.block;
      if (childBlockName) {
        makeBindings(childBlockName, childId);
      }
    }
  };

  instantiate(rootName, rootName, rootName, null, {}, 0);
  makeBindings(rootName, rootName);

  const interfaceIndex = buildInterfaceIndex(instances);
  validateBindings(bindings, interfaceIndex, problems);

  const graph = {
    root: rootName,
    blocks: [...model.blocks.values()],
    instances: [...instances.values()],
    bindings,
    problems,
  };

  console.info("[compose-flow] instantiated graph", {
    instances: graph.instances.length,
    bindings: graph.bindings.length,
    problems: graph.problems.length,
  });

  return graph;
}

function validateBindings(bindings, interfaceIndex, problems) {
  const bindingCounts = new Map();

  for (const binding of bindings) {
    const sourceKey = interfaceKey(binding.source.instanceId, binding.source.interfaceName);
    const targetKey = interfaceKey(binding.target.instanceId, binding.target.interfaceName);
    const source = interfaceIndex.get(sourceKey);
    const target = interfaceIndex.get(targetKey);

    if (!source) {
      problems.push(problem("error", "missing-source-interface", `Missing source interface ${sourceKey}`, { binding }));
      continue;
    }
    if (!target) {
      problems.push(problem("error", "missing-target-interface", `Missing target interface ${targetKey}`, { binding }));
      continue;
    }

    if (binding.kind !== "super") {
      bindingCounts.set(sourceKey, (bindingCounts.get(sourceKey) ?? 0) + 1);
      bindingCounts.set(targetKey, (bindingCounts.get(targetKey) ?? 0) + 1);
    }

    if (source.role !== target.role) {
      problems.push(problem("error", "role-mismatch", `Role mismatch: ${sourceKey}=${source.role}, ${targetKey}=${target.role}`, { binding }));
    }

    if (!source.polarity || !target.polarity) {
      problems.push(problem("info", "implicit-polarity", `Polarity is not explicit on ${sourceKey} or ${targetKey}`, { binding }));
    } else if (source.polarity === target.polarity) {
      problems.push(problem("error", "same-polarity", `Same polarity binding: ${sourceKey} and ${targetKey}`, { binding }));
    }
  }

  for (const [key, count] of bindingCounts.entries()) {
    const iface = interfaceIndex.get(key);
    const max = iface?.maxBindings;
    if (max && max !== "unlimited" && Number(max) > 0 && count > Number(max)) {
      problems.push(problem("error", "max-bindings-exceeded", `Max bindings exceeded for ${key}: ${count}/${max}`, { key, count, max }));
    }
  }

  if (bindings.length) {
    problems.push(problem("info", "block-type-compatibility-todo", "Block-type compatibility is not validated in this MVP", {}));
  }
}

export function buildInterfaceIndex(instances) {
  const index = new Map();
  for (const instance of instances.values ? instances.values() : instances) {
    for (const iface of instance.interfaces ?? []) {
      index.set(interfaceKey(instance.id, iface.name), iface);
    }
  }
  return index;
}

export function deriveScopes(graph) {
  return graph.instances
    .filter((instance) => instance.bodyStyle === "composite")
    .map((instance) => ({ id: instance.id, label: `${instance.name}: ${instance.blockName}` }));
}

export function toSerializableGraph(graph) {
  return {
    root: graph.root,
    blocks: graph.blocks,
    instances: graph.instances,
    bindings: graph.bindings,
    problems: graph.problems,
  };
}

function emptyGraph(message) {
  return { root: null, blocks: [], instances: [], bindings: [], problems: [problem("error", "empty", message, {})] };
}

function problem(level, code, message, details) {
  return { id: `${code}:${message}`, level, code, message, details };
}

export function interfaceKey(instanceId, interfaceName) {
  return `${instanceId}.${interfaceName}`;
}

function makeChildId(parentId, childName) {
  return `${parentId}/${childName}`;
}

function toArray(value) {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}
