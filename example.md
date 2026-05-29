# Invoice Processing Platform - VMS Compose Example

This document describes a comprehensive end-to-end example of a distributed invoice processing platform built using Skupper VMS Compose blocks.

## Overview

The Invoice Processing Platform is a microservices-based application that demonstrates real-world distributed system architecture patterns using the Skupper VMS Compose model. The platform handles invoice processing through a multi-tier architecture with separate concerns for API access, business logic, data persistence, and background processing.

## Architecture

### System Components

The platform consists of the following main components:

1. **API Layer** (`invoice-api`)
   - Exposed via ingress for external access
   - Handles HTTP requests from clients
   - Orchestrates calls to microservices
   - Enqueues background jobs

2. **Microservices Layer**
   - **Stock Service** - Manages inventory and stock data
   - **Pricing Service** - Calculates dynamic pricing

3. **Data Layer**
   - **PostgreSQL Databases** - Separate databases for invoice, stock, and pricing data
   - **Redis Queue** - Message queue for asynchronous job processing

4. **Worker Layer** (`invoice-worker`)
   - Background workers for async invoice processing
   - Consumes jobs from Redis queue
   - Updates invoice database

5. **Ingress** (`invoice-api/ingress`)
   - Kubernetes Ingress resource
   - TLS termination
   - Routes external traffic to API

### Component Hierarchy

```
invoice-platform (toplevel)
├── ingress                       [invoice-api/ingress]
├── api                           [invoice-api]
├── stock                         [stock-service/subsystem]
│   ├── service                   [stock-service]
│   ├── db                        [postgres/engine]
│   ├── store                     [postgres/volume]
│   └── svc-to-db                 [library/tcp-connection]
├── pricing                       [pricing-service/subsystem]
│   ├── service                   [pricing-service]
│   ├── db                        [postgres/engine]
│   ├── store                     [postgres/volume]
│   └── svc-to-db                 [library/tcp-connection]
├── invoice-db                    [postgres/engine]
├── invoice-store                 [postgres/volume]
├── queue                         [redis/engine]
├── worker                        [invoice-worker]
└── connections (9x)              [library/tcp-connection]
```

## Site Classes

The platform uses three site classes to control deployment topology:

- **`hq`** - Central datacenter
  - Databases (invoice, stock, pricing)
  - Redis queue
  - Persistent storage

- **`api`** - DMZ / Edge sites
  - API gateway
  - Ingress resources
  - Public-facing components

- **`worker`** - Compute sites
  - Microservices (stock, pricing)
  - Background workers
  - Horizontally scalable workloads

## Library Blocks

The example uses three reusable library blocks:

### 1. `postgres/engine`

PostgreSQL database server.

**Interfaces:**
- `postgres` (accept, unlimited bindings) - PostgreSQL protocol on port 5432
- `files` (mount) - Volume mount point for data persistence

**Configuration:**
- `POSTGRES_DB` - Database name
- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `imageVersion` - PostgreSQL version (default: "15")

**Generated Resources:**
- Deployment with PostgreSQL container
- Configured with environment variables and volume mounts

### 2. `postgres/volume`

Persistent volume claim for database storage.

**Interfaces:**
- `mountpoint` (mount) - Provides persistent storage

**Configuration:**
- `storageClass` - Kubernetes storage class (default: "standard")
- `capacity` - Volume size (default: "5Gi")
- `namePrefix` - PVC name prefix

**Generated Resources:**
- PersistentVolumeClaim

### 3. `library/tcp-connection`

Generic TCP connection between components.

**Interfaces:**
- `acceptor` (accept) - Binds to the accepting service
- `connector` (connect) - Binds to the connecting client

**Configuration:**
- `keyPrefix` - Annotation key prefix for routing
- `protocol` - Application protocol (http, postgres, redis, etc.)
- `connectorType` - Connection type (selector, direct)
- `distribution` - Load balancing algorithm (balanced, closest)
- `priority` - Traffic priority (1-9)
- `networkPolicyOnAcceptor` - Enable NetworkPolicy on acceptor
- `networkPolicyOnConnector` - Enable NetworkPolicy on connector
- `vanFlowTransport` - Enable VAN flow transport observability
- `vanFlowProtocol` - Enable VAN flow protocol observability

## Application Blocks

### invoice-api

REST API gateway for the invoice platform.

**Type:** `skupperx.io/component`

**Interfaces:**
- `http` (accept) - HTTP server on port 8080
- `stock` (connect) - Connection to stock service
- `pricing` (connect) - Connection to pricing service
- `database` (connect) - Connection to invoice database
- `queue` (connect) - Connection to Redis queue

**Configuration:**
- `replicas` (numeric, default: 2) - Number of replicas
- `logLevel` (enum: debug|info|warn|error, default: info)
- `enableMetrics` (bool, default: true) - Expose Prometheus metrics
- `metricsPort` (numeric, default: 9090) - Metrics port
- `imageVersion` (string, default: latest)

**Features Demonstrated:**
- Multiple interfaces (1 accept + 4 connect)
- All config types (string, string-name, numeric, bool, enum)
- `$localif.<name>` for every connect interface
- `$site.name` for site-aware labeling
- Conditional template blocks (`{{-if}}` / `{{-else}}` / `{{-end}}`)
- targetPlatforms

### stock-service

Microservice for stock/inventory management.

**Type:** `skupperx.io/component`

**Interfaces:**
- `http` (accept) - HTTP server on port 8081
- `database` (connect) - Connection to stock database

**Configuration:**
- `replicas` (numeric, default: 1)
- `cacheEnabled` (bool, default: true) - Enable in-memory cache
- `cacheTTL` (numeric, default: 300) - Cache TTL in seconds
- `imageVersion` (string, default: latest)

**Features Demonstrated:**
- Boolean config driving conditional env blocks
- Numeric config for cache TTL

### pricing-service

Microservice for dynamic pricing calculations.

**Type:** `skupperx.io/component`

**Interfaces:**
- `http` (accept) - HTTP server on port 8082
- `database` (connect) - Connection to pricing database

**Configuration:**
- `replicas` (numeric, default: 1)
- `pricingStrategy` (enum: standard|premium|dynamic, default: standard)
- `imageVersion` (string, default: latest)

**Features Demonstrated:**
- Enum config for pricing strategy selection

### redis/engine

Redis server for message queue.

**Type:** `skupperx.io/component`

**Interfaces:**
- `queue` (accept, unlimited bindings) - Redis protocol on port 6379
- `files` (mount) - Volume mount for persistence

**Configuration:**
- `maxMemory` (string, default: "256mb") - Redis max memory
- `evictionPolicy` (enum, default: "allkeys-lru") - Eviction policy
- `imageVersion` (string, default: "7")

**Features Demonstrated:**
- maxBindings: unlimited (multiple clients can connect)
- mount interface pattern (same as postgres/engine)

### invoice-worker

Background worker for asynchronous invoice processing.

**Type:** `skupperx.io/component`

**Interfaces:**
- `queue` (connect) - Connection to Redis queue
- `database` (connect) - Connection to invoice database

**Configuration:**
- `replicas` (numeric, default: 1) - Parallel worker replicas
- `batchSize` (numeric, default: 10) - Invoices per batch
- `enableRetry` (bool, default: true) - Enable job retry
- `maxRetries` (numeric, default: 3) - Max retry attempts
- `imageVersion` (string, default: latest)

**Features Demonstrated:**
- Two connect interfaces
- Boolean + numeric config combination
- Conditional env vars driven by enableRetry

### invoice-api/ingress

Kubernetes Ingress for external API access.

**Type:** `skupperx.io/ingress`

**Interfaces:**
- `connector` (connect) - Connection to invoice-api service

**Configuration:**
- `hostname` (string, default: "invoice.example.com")
- `tlsEnabled` (bool, default: true) - Enable TLS
- `tlsSecretName` (string, default: "invoice-tls-secret")

**Features Demonstrated:**
- skupperx.io/ingress block type
- Conditional TLS configuration

### stock-service/subsystem

Composite block bundling stock service with its database.

**Type:** `skupperx.io/component` (bodyStyle: composite)

**Interfaces:**
- `http` (accept) - Exposed via super binding from stock-service

**Child Blocks:**
- `service` - stock-service instance
- `db` - postgres/engine instance
- `store` - postgres/volume instance
- `svc-to-db` - library/tcp-connection linking service to database

**Features Demonstrated:**
- Composite block pattern
- Super binding (propagates http interface upward)
- siteClasses per child (worker vs hq)
- Config override on child block

### pricing-service/subsystem

Composite block bundling pricing service with its database.

**Type:** `skupperx.io/component` (bodyStyle: composite)

**Interfaces:**
- `http` (accept) - Exposed via super binding from pricing-service

**Child Blocks:**
- `service` - pricing-service instance (with pricingStrategy override)
- `db` - postgres/engine instance
- `store` - postgres/volume instance
- `svc-to-db` - library/tcp-connection linking service to database

**Features Demonstrated:**
- Same composite pattern as stock-service/subsystem
- Config override: pricingStrategy set to "dynamic"

### invoice-platform

Top-level application assembly.

**Type:** `skupperx.io/toplevel` (bodyStyle: composite)

**Features Demonstrated:**
- Nested composite blocks (subsystems) alongside leaf blocks
- siteClasses on every child
- Config overrides at toplevel (replicas, logLevel, etc.)
- distribution: closest + priority on latency-sensitive paths
- vanFlowTransport + vanFlowProtocol on queue connections
- networkPolicyOnAcceptor + networkPolicyOnConnector on DB links
- Binding to interfaces exposed via super

## Connection Topology

The platform defines 9 TCP connections:

1. **ingress-to-api** - External traffic to API
   - Protocol: http
   - ConnectorType: selector

2. **api-to-stock** - API to Stock service
   - Protocol: http
   - Distribution: closest (low latency)
   - Priority: 7 (high)
   - NetworkPolicy on acceptor

3. **api-to-pricing** - API to Pricing service
   - Protocol: http
   - Distribution: balanced
   - NetworkPolicy on acceptor

4. **api-to-invoice-db** - API to Invoice database
   - Protocol: postgres
   - NetworkPolicy on both sides

5. **api-to-queue** - API to Redis queue
   - Protocol: redis
   - VAN flow observability enabled
   - NetworkPolicy on acceptor

6. **worker-to-invoice-db** - Worker to Invoice database
   - Protocol: postgres
   - NetworkPolicy on both sides

7. **worker-to-queue** - Worker to Redis queue
   - Protocol: redis
   - VAN flow observability enabled
   - NetworkPolicy on acceptor

8. **stock/svc-to-db** - Stock service to its database (internal to subsystem)

9. **pricing/svc-to-db** - Pricing service to its database (internal to subsystem)

## Data Flow

### Synchronous Request Path

```
User → ingress → api → stock/pricing → stock-db/pricing-db
                 ↓
            invoice-db
```

1. User makes HTTP request to ingress
2. Ingress routes to invoice-api
3. API calls stock-service and pricing-service (parallel)
4. Each service queries its database
5. API aggregates results and updates invoice-db
6. Response returned to user

### Asynchronous Job Path

```
api → queue → worker → invoice-db
```

1. API enqueues job to Redis queue
2. Worker consumes job from queue
3. Worker processes invoice
4. Worker updates invoice-db
5. Worker retries on failure (if enabled)

## Deployment Topology

### HQ Site (Central Datacenter)

- PostgreSQL databases (invoice, stock, pricing)
- Redis queue
- Persistent volumes
- High-reliability, persistent storage

### API Site (DMZ/Edge)

- Ingress resources
- API gateway instances
- Public-facing, low-latency access

### Worker Site (Compute)

- Stock service
- Pricing service
- Invoice workers
- Horizontally scalable workloads

## Configuration Highlights

### API Layer
- 3 replicas for high availability
- Log level: warn (reduced verbosity in production)
- Metrics enabled for observability

### Worker Layer
- 3 worker replicas for parallel processing
- Batch size: 25 invoices per batch
- Retry enabled with max 5 attempts

### Queue
- Max memory: 512MB
- Eviction policy: allkeys-lru

### Databases
- Invoice DB: PostgreSQL 15, 20Gi storage
- Stock/Pricing DBs: Default configuration

### Network Policies
- Database connections protected with NetworkPolicy on both sides
- Stock service protected with NetworkPolicy on acceptor
- Queue protected with NetworkPolicy on acceptor

### Traffic Optimization
- Stock lookups use "closest" distribution for low latency
- Stock path has priority 7 (high priority)
- Pricing uses "balanced" distribution for even load

### Observability
- VAN flow enabled on queue connections for message tracking
- Metrics exposed on API service

## Key VMS Compose Features Demonstrated

1. **Block Types**
   - Component (simple and composite)
   - Ingress
   - Toplevel
   - Connector

2. **Configuration Types**
   - string, string-name
   - numeric
   - bool
   - enum with typeValues

3. **Interface Roles**
   - accept (server-side)
   - connect (client-side)
   - mount (storage)

4. **Interface Features**
   - maxBindings (1, unlimited)
   - data properties

5. **Composite Patterns**
   - Nested blocks
   - Super bindings (interface propagation)
   - siteClasses per child
   - Config overrides

6. **Connection Features**
   - Protocol specification
   - Distribution algorithms
   - Priority levels
   - Network policies
   - VAN flow observability

7. **Template Features**
   - `$localif.<interface>.<property>` - Local interface data
   - `$site.name` - Site information
   - `{{.config}}` - Configuration values
   - `{{-if}}` / `{{-else}}` / `{{-end}}` - Conditionals
   - targetPlatforms - Platform selection

## Statistics

- **Total Blocks:** 12 (3 library + 9 application)
- **Total Instances:** 24
- **Total Bindings:** 23
- **Total Interfaces:** 42
- **Site Classes:** 3 (hq, api, worker)
- **Database Instances:** 3 (invoice, stock, pricing)
- **Microservices:** 2 (stock, pricing)
- **TCP Connections:** 9

## Using This Example

### Load in Compose Flow MVP

1. Upload the file via the "Upload YAML" button, or
2. Drag and drop `example.yaml` into the visualizer

### Recommended Viewing Path

1. Start with **View: landscape** and **Scope: invoice-platform**
   - See the high-level architecture

2. Switch **Scope** to `invoice-platform/stock`
   - Inspect the stock-service subsystem internals

3. Switch **Scope** to `invoice-platform/pricing`
   - Inspect the pricing-service subsystem internals

4. Switch **View** to **bindings**
   - See all interface connections

5. Use **resources** view
   - View generated Kubernetes/Skupper resources

6. Use **validation** view
   - Review any validation notes

7. Enable **include descendants**
   - See the full nested hierarchy

### Exploring Different Scopes

Try switching scope to:
- `invoice-platform/stock/service` - Stock service internals
- `invoice-platform/pricing/service` - Pricing service internals
- `invoice-platform` - Top-level view

## Extension Ideas

This example can be extended to demonstrate additional patterns:

- Add monitoring/observability blocks (Prometheus, Grafana)
- Add API versioning with multiple API versions
- Add caching layer (Memcached, Redis cache)
- Add event streaming (Kafka blocks)
- Add authentication service (OAuth, OIDC)
- Add rate limiting / API gateway features
- Add backup/restore blocks
- Add health check/readiness probe blocks
- Add service mesh integration
- Add multi-region failover patterns

## Summary

This invoice processing platform demonstrates a realistic, production-like distributed application using Skupper VMS Compose. It showcases:

- Multi-tier microservices architecture
- Separation of concerns (API, business logic, data, workers)
- Composite block reuse (subsystems)
- Site-based topology control
- Network policy security
- Traffic optimization (distribution, priority)
- Observability integration
- Configuration management
- Resource generation

The example provides a comprehensive reference for building complex distributed systems with the VMS Compose model.
