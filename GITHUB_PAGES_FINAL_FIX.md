# GitHub Pages Final Fix - YAML 404 Errors

## Problem

When the site loads on GitHub Pages, it tries to fetch:
```
https://pwright.github.io/examples/nearestprime.yaml  ❌ 404
https://pwright.github.io/examples/example.yaml       ❌ 404
```

But the files are actually at:
```
https://pwright.github.io/composite-flow-mvp/examples/nearestprime.yaml  ✅
https://pwright.github.io/composite-flow-mvp/examples/example.yaml       ✅
```

## Root Cause

The code was using absolute paths `/examples/...` which don't include the repository base path.

**Before:**
```javascript
fetch("/examples/nearestprime.yaml")  // Wrong on GitHub Pages
```

**After:**
```javascript
const baseUrl = import.meta.env.BASE_URL;  // "/" or "/composite-flow-mvp/"
fetch(`${baseUrl}examples/nearestprime.yaml`)  // Correct everywhere
```

## What Was Fixed

### 1. vite.config.js
Changed base path from `/compose-flow-mvp/` to `/composite-flow-mvp/`

### 2. src/App.jsx
Changed both YAML fetch calls to use `import.meta.env.BASE_URL`:

**Line ~43:**
```javascript
fetch(`${baseUrl}examples/nearestprime.yaml`)
```

**Line ~139:**
```javascript
fetch(`${baseUrl}examples/example.yaml`)
```

## How BASE_URL Works

Vite automatically provides `import.meta.env.BASE_URL` based on the config:

- **Local development**: `BASE_URL = "/"`
  - Fetches: `/examples/nearestprime.yaml`
  
- **GitHub Pages**: `BASE_URL = "/composite-flow-mvp/"`
  - Fetches: `/composite-flow-mvp/examples/nearestprime.yaml`

## Commit and Deploy

```bash
git add vite.config.js src/App.jsx
git commit -m "Fix YAML file paths for GitHub Pages"
git push origin main
```

Wait 1-2 minutes for GitHub Actions to deploy, then visit:
```
https://pwright.github.io/composite-flow-mvp/
```

## Verification

After deployment, the site should:
- ✅ Load with white background (not black)
- ✅ Show the nearestprime example by default
- ✅ "Load Complex Example" button works
- ✅ No 404 errors in browser console
- ✅ No YAML parse errors

## What You Should See

1. Page loads immediately with the simple example (nearestprime.yaml)
2. Click "Load Complex Example" → invoice platform loads
3. All controls work (pan, zoom, layout options)
4. No errors in console

## If Still Not Working

1. **Hard refresh**: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
2. **Clear cache**: Browser settings → Clear browsing data
3. **Check deployment**: GitHub → Actions → Verify workflow succeeded
4. **Incognito mode**: Try in a private/incognito window

## Summary

Two fixes were needed:
1. Repository name: `compose` → `composite`
2. YAML paths: absolute → base-relative

Both issues are now fixed. The site will work correctly on GitHub Pages after deployment.
