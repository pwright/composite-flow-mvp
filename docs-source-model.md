[DeepWiki](https://deepwiki.com/)

[skupperproject/vms](https://deepwiki.com/skupperproject/vms)

define blocks and express contents in sort of math clarity

Deep

Here is a formal, set-theoretic definition of the Block system in SkupperVMS Compose.

---

## Block — Formal Definition

A **Block** is a 3-tuple:

---

### 1\. — Block Type

Each type carries three constraints:.

---

### 2.

The key is (e.g., ).

---

### 3.

#### 3a.

#### 3b.

A map of named parameters with types and defaults:

#### 3c.

**Polarity constraint** (enforced at validation):

#### 3d. — depends on

**When:**

Templates with are only expanded when the block is deployed via a binding on that interface.

**When:**

---

### 4\. — the connection between two Blocks

---

### 5\. — runtime instantiation of a LibraryBlock

Config resolution priority (highest → lowest):

---

### Summary diagram

The entire composition of an application is a **graph** where:

- \= set of s
- \= set of s (edges between nodes, constrained by polarity and role)

[skupperproject/vms](https://github.com/skupperproject/vms) [components/management-controller/src/compose.js](https://github.com/skupperproject/vms/blob/aacfe935/components/management-controller/src/compose.js#L34-L35)

```
const COMPOSE_PREFIX = '/compose/v1alpha1/';
const API_VERSION    = 'skupperx.io/compose/v1alpha1';
const PROCESS_ERROR  = 'process-error';
```

```
const BODY_STYLE_SIMPLE    = 'simple';
const BODY_STYLE_COMPOSITE = 'composite';
```

```
var cachedApplications = {};
```

```
}
}
```

```
class BlockInterface {
    constructor(ownerRef, ifaceName, ifaceSpec, blockType, buildLog) {
        this.ownerRef      = ownerRef;
        this.name          = ifaceName;
        this.role          = ifaceSpec.role;
        this.polarity      = ifaceSpec.polarity == 'north';
        this.blockType     = blockType;
        this.maxBindings   = ifaceSpec.maxBindings ? ifaceSpec.maxBindings == 'unlimited' ? 0 : parseInt(ifaceSpec.maxBindings) : 1;
        this.bindings      = [];
        this.boundThrough  = false;
        this.metadata      = deepCopy(ifaceSpec.data || {});
 
        buildLog.log(\`    ${this}\`);
    }
 
    toString() {
        return \`BlockInterface ${this.ownerRef.name}.${this.name} (${this.blockType}.${this.role}) ${this.polarity ? 'north' : 'south'} max:${this.maxBindings ? this.maxBindings : 'unl'}\`;
    }
```

```
getName() {
    return this.name;
```

```
}
}
```

```
class InstanceBlock {
    constructor(instanceConfig) {
        this.libraryBlock = undefined;
        this.name         = undefined;
        this.config       = instanceConfig;
        this.interfaces   = {};
        this.derivative   = {};
        this.dbid         = null;
        this.metadata     = {};
        this.flag         = false;
    }
 
    _buildInterfaces(buildLog) {
        const ilist = this.libraryBlock.interfaces();
        if (ilist) {
            for (const [iname, iface] of Object.entries(ilist)) {
                this.interfaces[iname] = new BlockInterface(this, iname, iface, iface.blockType || this.libraryBlock.nameNoRev(), buildLog);
            }
        }
    }
 
    buildFromApi(libraryBlock, name, buildLog) {
        this.libraryBlock = libraryBlock;
        this.name         = name;
 
        this.metadata.ident = NewIdentity();
        this.metadata.name  = name;
 
        buildLog.log(\`${this}\`);
        this._buildInterfaces(buildLog);
    }
```

```
buildFromDatabase(row, libraryBlock, buildLog) {
    this.libraryBlock = libraryBlock;
```

```
}
}
```

```
class LibraryBlock {
    constructor(dbRecord, buildLog) {
        this.item = {
            apiVersion : API_VERSION,
            kind       : 'Block',
            type       : dbRecord.type,
            metadata   : {
                name     : dbRecord.name,
                revision : dbRecord.revision,
            },
            spec : {
                bodyStyle  : dbRecord.bodystyle,
                config     : load(dbRecord.config),
                interfaces : load(dbRecord.interfaces),
                body       : load(dbRecord.specbody),
            }
        };
```

```
this.flag = false;
this.dbid = dbRecord.id;
```

```
return \`LibraryBlock ${this.name()} (${this.item.type})\`;
}
```

```
name() {
    return \`${this.item.metadata.name};${this.item.metadata.revision}\`;
}

nameNoRev() {
    return this.item.metadata.name;
}
```

```
getType() {
    return this.item.type;
```

```
}
}
```

```
class InterfaceBinding {
    constructor(left, right, buildLog) {
        if (left.polarity == right.polarity) {
            buildLog.error(\`Attempting to bind interfaces with the same polarity: ${left}, ${right}\`)
        }
 
        this.northRef = left.polarity ? left : right;
        this.southRef = left.polarity ? right : left;
 
        for (const ref of [this.southRef, this.northRef]) {
            if (!ref.canAcceptBinding()) {
                buildLog.error(\`Attempting to bind an interface that will exceed the interface's maxBinding count: ${ref}\`)
            }
        }
 
        if (this.southRef.role != this.northRef.role) {
            buildLog.error(\`Attempting to bind interfaces with different roles: ${this.southRef}, ${this.northRef}\`)
        }
 
        // TODO - check the compatibility of the block-types
 
        this.northRef.addBinding(this);
        this.southRef.addBinding(this);
 
        buildLog.log(\`${this}\`);
    }
```

```
toString() {
    return \`InterfaceBinding [${this.northRef}] <=> [${this.southRef}]\`;
```

```
}

//
```

```
// Recursive component instantiation function.
//
instantiateSubComponents(path, libraryBlock, instanceName, buildLog) {
    if (libraryBlock.getBodyStyle() == BODY_STYLE_COMPOSITE) {
        const body = libraryBlock.body();
        //
        // This is a composite block.  Begin by creating instances of all of the block's children.
        //
        for (const [name, child] of Object.entries(body)) {
            if (!child.block) {
                buildLog.error(\`Invalid item ${name} in composite blocks for ${instanceName}\`)
            }
            const libraryChild = this.libraryBlocks[child.block];
            if (!libraryChild) {
                buildLog.error(\`Composite component ${instanceName} references a nonexistent library block ${child.block}\`)
            }
            const subConfig = child.config || {};
            const subPath = path + name;
            let instanceBlock = new InstanceBlock(subConfig);
            this.instanceBlocks[subPath] = instanceBlock;
            instanceBlock.buildFromApi(libraryChild, subPath, buildLog);

            if (child.siteClasses && typeof(child.siteClasses) == "object") {
                let siteClasses = [];
                for (const sclass of child.siteClasses) {
                    siteClasses.push(sclass);
                }
                instanceBlock.addDerivative('siteClasses', siteClasses);
            }

            this.instantiateSubComponents(subPath + '/', libraryChild, child.name, buildLog);
        }

        //
        // Iterate again through the children and look for bindings.
        //
        for (const [name, child] of Object.entries(body)) {
            if (child.bindings) {
                const childPath = path + name;
                for (const [iname, binding] of Object.entries(child.bindings)) {
                    if (binding.super) {
                        //
                        // This is a binding to the containing composite block.
                        // No action is needed here because "super" bindings are
                        // resolved downward from composite blocks that instantiate
                        // this composite sub-block.
                        //
                    } else {
                        //
                        // This is a binding between child blocks within this composite.
                        //
                        const childInterfaceName       = iname;
                        const remoteBlockPath          = path + binding.block;
                        const remoteBlockInterfaceName = binding.blockInterface;

                        const childInstance  = this.instanceBlocks[childPath];
                        const remoteInstance = this.instanceBlocks[remoteBlockPath];

                        if (!remoteInstance) {
                            buildLog.error(\`Unknown reference ${remoteBlockPath} in ${libraryBlock}\`);
                        }

                        const childInterface  = this.findBaseInterface(childInstance, childInterfaceName, buildLog);
                        const remoteInterface = this.findBaseInterface(remoteInstance, remoteBlockInterfaceName, buildLog);

                        const ifBinding = new InterfaceBinding(childInterface, remoteInterface, buildLog);
                        this.bindings.push(ifBinding);
                    }
                }
            }
        }
    }
```

```
}

//
```

```
const name = block.metadata.name;
```

```
let allowNorth = false;
let allowSouth = false;
if (block.type && validTypes[block.type]) {
    allowNorth = validTypes[block.type].allowNorth;
    allowSouth = validTypes[block.type].allowSouth;
} else {
    return \`Invalid block type: ${block.type}\`;
}
```

```
if (blockRevisions[name] && blockRevisions[name].btype != block.type) {
    return \`Block ${name} conflicts with another block of the same name but different type\`;
```

```
if (iface.polarity != 'north' && iface.polarity != 'south') {
    return \`Polarity must be 'north' or 'south' for interface ${iname}, block ${name}\`
}
```

```
if (iface.polarity == 'north' && !allowNorth) {
        return \`North polarity not permitted for interface ${iname}, block ${name}\`;
    }

    if (iface.polarity == 'south' && !allowSouth) {
        return \`South polarity not permitted for interface ${iname}, block ${name}\`;
    }
}
```

```
}
}
```

[skupperproject/vms](https://github.com/skupperproject/vms) [tests/blocks.yaml](https://github.com/skupperproject/vms/blob/aacfe935/tests/blocks.yaml#L29-L68)

```
annotations:
    platform: skupper-v2
spec:
```

```
config:
  keyPrefix:
    type: string-name
    description: "Prefix annotation for the generated routing keys"
    default: tcp
  distribution:
    type: enum
    typeValues: ["balanced", "closest"]
    description: "Distribution algorithm used in the network for service traffic"
    default: balanced
  priority:
    type: enum
    typeValues: [lowest, "1", "2", "3", normal, "5", "6", "7", "8", "9", highest]
    description: "Priority used to forward service traffic through the network"
    default: normal
  protocol:
    type: string-name
    description: "Application protocol that runs over the transport"
    default: none
  connectorType:
    type: enum
    typeValues: ["host", "selector"]
    description: "How the connector locates target processes"
    default: selector
  networkPolicyOnAcceptor:
    type: bool
    description: "Generate network policy to match the acceptor"
    default: false
  networkPolicyOnConnector:
    type: bool
    description: "Generate network policy to match the connector"
    default: false
  vanFlowTransport:
    type: bool
    description: "Generate vanFlow transport events"
    default: false
  vanFlowProtocol:
    type: bool
    description: "Generate vanFlow protocol events"
    default: false
```

```
requiredAverageRate:
  type: numeric
  description: Expected average bandwidth usage
```

```
role: accept
connector:
  role: connect
```

```
bodyStyle: simple
body:
- affinity: [acceptor]
  targetPlatforms: [sk2]
  description: "Interface to Skupper-v2 acceptors on kubernetes sites"
  template: |
    ---
    apiVersion: skupper.io/v2alpha1
    kind: Connector
    metadata:
      name: connector-{{.ident}}
    spec:
      type: tcp
      selector: {{$affblock.selectorKey}}={{$affblock.selectorValue}}
      port: {{$affif.port}}
      routingKey: {{.keyPrefix}}{{.name}}
    {{- if .networkPolicyOnAcceptor}}
```

```
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
```

```
interfaces:
  postgres:
    role: accept
```

```
bodyStyle: composite
  body:
    database:
      block: postgres/engine
      siteClasses:
      - hq
      bindings:
        postgres:
          super: postgres
    store:
      block: postgres/volume
      bindings:
        mountpoint:
          block: database
          blockInterface: files
 
---
apiVersion: skupperx.io/compose/v1alpha1
kind: Block
metadata:
  name: nearestprime/main
type: skupperx.io/component
spec:
  interfaces:
    request:
      role: accept
  bodyStyle: composite
  body:
    database:
      block: postgres/subsystem
      siteClasses:
      - hq
    worker:
      block: nearestprime
      config:
        replicas: 2
      siteClasses:
      - worker
      bindings:
        control:
          super: request
    worker-to-database:
      block: library/tcp-connection
      config:
        keyPrefix: pg
        protocol: postgres
        connectorType: selector
        networkPolicyOnAcceptor: true
        networkPolicyOnConnector: true
      bindings:
        connector:
          block: worker
          blockInterface: postgres
        acceptor:
          block: database
          blockInterface: postgres
```

```
---
apiVersion: skupperx.io/compose/v1alpha1
```