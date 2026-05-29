# Example Files Guide

The Compose Flow MVP includes two bundled example YAML files to demonstrate different levels of complexity.

## Bundled Examples

### 1. nearestprime.yaml (Default)

**Loaded by default when the app starts**

- **Complexity**: Simple
- **Blocks**: 7 library blocks + application blocks
- **Purpose**: Quick introduction to VMS Compose concepts
- **Best for**: Learning the basics, testing features

**Key Features:**
- TCP connection pattern
- PostgreSQL database blocks
- Basic composite structure
- Clear hierarchy

**How to Load:**
- Automatically loaded on app start
- Reload page to return to this example

---

### 2. example.yaml (Invoice Platform)

**Click "Load Complex Example" button to load**

- **Complexity**: Complex, production-like
- **Blocks**: 12 (3 library + 9 application)
- **Instances**: 24
- **Bindings**: 23
- **Purpose**: Comprehensive demonstration of VMS Compose features
- **Best for**: Understanding real-world architecture patterns

**Key Features:**
- Multi-tier microservices architecture
- Composite subsystems with super bindings
- Site-based deployment topology (hq, api, worker)
- Network policies and security
- Traffic optimization (distribution, priority)
- VAN flow observability
- All config types (string, numeric, bool, enum)
- Conditional templating
- Multiple databases
- Message queue integration
- Background workers

**Components:**
1. **API Layer** (invoice-api)
2. **Ingress** (invoice-api/ingress)
3. **Stock Service Subsystem** (stock-service + postgres + volume)
4. **Pricing Service Subsystem** (pricing-service + postgres + volume)
5. **Invoice Database** (postgres + volume)
6. **Redis Queue**
7. **Background Workers**
8. **9 TCP Connections** (connecting all components)

**How to Load:**
- Click the green "Load Complex Example" button in the top toolbar
- Button is located to the left of "Upload YAML"

**Recommended Viewing:**
1. Start at `invoice-platform` scope with Auto Grid layout
2. Explore subsystems: `invoice-platform/stock` and `invoice-platform/pricing`
3. Switch to Bindings view to see all connections
4. Try different layout modes (horizontal works well for subsystems)
5. Enable "include descendants" to see the full hierarchy

**Documentation:**
- See `example.md` for comprehensive architecture documentation
- See `EXAMPLE_SUMMARY.md` for quick reference

---

## Comparison

| Feature | nearestprime.yaml | example.yaml |
|---------|-------------------|--------------|
| Complexity | Simple | Complex |
| Blocks | ~7 | 12 |
| Instances | ~8 | 24 |
| Bindings | ~5 | 23 |
| Site Classes | Few | 3 (hq, api, worker) |
| Composite Blocks | 1-2 | 2 subsystems |
| Super Bindings | No | Yes |
| Load Time | Instant | ~100ms |
| Best Layout | Horizontal/Auto Grid | Auto Grid |
| Learning Goal | Basics | Advanced patterns |

## Using the Examples

### On Initial Load
The app automatically loads `nearestprime.yaml` to provide a quick, simple introduction.

### Loading the Complex Example
1. Look for the **green "Load Complex Example"** button in the top toolbar
2. Click it to load the invoice platform
3. Wait ~100ms for parsing
4. The view will update to show the invoice-platform root scope

### Switching Between Examples
- **To nearestprime**: Reload the page
- **To invoice platform**: Click "Load Complex Example"
- **To your own file**: Use "Upload YAML" or drag-and-drop

### After Loading Complex Example

**Recommended exploration path:**

1. **Start at the top**
   - Scope: `invoice-platform`
   - Layout: Auto Grid (default)
   - View: Landscape

2. **Explore a subsystem**
   - Scope: `invoice-platform/stock`
   - See how stock-service + database + connection are bundled

3. **View bindings**
   - View: Bindings
   - See all 23 connections visualized

4. **Check resources**
   - View: Resources
   - See generated Kubernetes resources

5. **Try layouts**
   - Horizontal: See the pipeline flow
   - Vertical: Compact width
   - Grid: Fixed 3-column layout

## Creating Your Own Examples

Want to create your own example files?

1. **Start simple**: Copy and modify `nearestprime.yaml`
2. **Reference complex patterns**: Use `example.yaml` as a template
3. **Test incrementally**: Build up complexity gradually
4. **Document well**: Use comments like the examples do

**Required structure:**
```yaml
apiVersion: skupperx.io/compose/v1alpha1
kind: Block
metadata:
  name: your-block-name
type: skupperx.io/component  # or toplevel, ingress, connector
spec:
  # Your block definition
```

**Tips:**
- Define library blocks first
- Use meaningful block names
- Add comments explaining patterns
- Test with the visualizer frequently
- Start with simple blocks, add composite later

## Troubleshooting

### "Load Complex Example" button disabled
- The button is disabled during loading
- Wait for current operation to complete

### Example fails to load
- Check browser console for errors
- Ensure `public/examples/example.yaml` exists
- Try reloading the page

### Can't see all nodes
- Enable "include descendants" checkbox
- Adjust scope to parent level
- Try Auto Grid layout for better space usage

### Layout looks wrong
- Try different layout modes
- Auto Grid adapts best to any child count
- Horizontal works well for 2-5 children
- Vertical works well for 6+ children

## Summary

The Compose Flow MVP provides two examples:

1. **nearestprime.yaml** - Simple, loaded by default
2. **example.yaml** - Complex, click "Load Complex Example" button

Both examples demonstrate different aspects of the VMS Compose model. Start with the simple example to learn the basics, then explore the complex example to see real-world architecture patterns.

The green "Load Complex Example" button provides instant access to the comprehensive invoice platform demonstration without requiring file upload.
