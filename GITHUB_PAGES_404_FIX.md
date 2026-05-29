# GitHub Pages 404 Fix

If you're seeing black screen and 404 errors for assets, this is a **base path issue**.

## Problem

Assets are being requested from the wrong path:
```
❌ https://username.github.io/assets/index-xxx.js  (404)
✅ https://username.github.io/REPO-NAME/assets/index-xxx.js  (correct)
```

## Quick Fix

### Step 1: Find Your Repository Name

Look at your GitHub repository URL:
```
https://github.com/<username>/<REPO-NAME>
```

The part after your username is your repository name.

Or run locally:
```bash
git remote -v
```

### Step 2: Update vite.config.js

Open `vite.config.js` and change this line:

**Current:**
```javascript
base: process.env.GITHUB_PAGES ? "/compose-flow-mvp/" : "/",
```

**Change to:**
```javascript
base: process.env.GITHUB_PAGES ? "/YOUR-REPO-NAME/" : "/",
```

Replace `YOUR-REPO-NAME` with your actual repository name from Step 1.

**Example:** If your repo is named `my-flow-app`:
```javascript
base: process.env.GITHUB_PAGES ? "/my-flow-app/" : "/",
```

### Step 3: Commit and Push

```bash
git add vite.config.js
git commit -m "Fix GitHub Pages base path"
git push origin main
```

### Step 4: Wait for Deployment

1. Go to **Actions** tab on GitHub
2. Wait for workflow to complete (~1-2 minutes)
3. Reload your GitHub Pages site

## Verify the Fix

After deployment completes:

1. Visit your site: `https://<username>.github.io/<REPO-NAME>/`
2. Open browser Developer Tools (F12)
3. Go to Console tab
4. Should see no 404 errors
5. Page should load with white background and controls

## Alternative: Use Root Domain

If you want to deploy to the root (`https://<username>.github.io/` without a subdirectory):

### Requirements
- Repository must be named: `<username>.github.io`
- Example: If username is `john`, repo must be `john.github.io`

### Configuration
```javascript
base: "/",  // No subdirectory needed
```

Remove the environment variable check entirely.

## Still Not Working?

### Check 1: Workflow Environment Variable

Open `.github/workflows/deploy.yml` and verify:

```yaml
- name: Build
  run: npm run build
  env:
    GITHUB_PAGES: true  # This line must be present
```

### Check 2: Build Output

1. Go to Actions → Latest workflow run
2. Click "build" job
3. Look at the build output
4. Find a line like: `dist/index.html`
5. Check the paths in the HTML

Should see:
```html
<script src="/REPO-NAME/assets/index-xxx.js"></script>
```

NOT:
```html
<script src="/assets/index-xxx.js"></script>
```

### Check 3: Test Locally

Build with the GitHub Pages flag locally:

```bash
GITHUB_PAGES=true npm run build
cat dist/index.html
```

Check the script/link tags have the correct base path.

## Common Mistakes

❌ **Forgot to update vite.config.js**
- Must match your actual repository name exactly
- Case-sensitive!

❌ **Missing trailing slash**
```javascript
base: "/my-repo"   // ❌ Wrong
base: "/my-repo/"  // ✅ Correct
```

❌ **Wrong repository name**
```javascript
base: "/compose-flow-mvp/"  // ❌ If your repo is named differently
base: "/my-actual-repo/"    // ✅ Use your actual repo name
```

❌ **Repository renamed but config not updated**
- If you renamed your repository on GitHub, update vite.config.js

## Complete vite.config.js Example

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? "/YOUR-REPO-NAME/" : "/",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom"],
          "react-flow": ["@xyflow/react"],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
```

Replace `YOUR-REPO-NAME` with your actual repository name.

## Need Help?

1. What is your repository URL? (e.g., `https://github.com/username/repo-name`)
2. What does your `vite.config.js` currently say for `base:`?
3. What is the exact error in browser console?

With this info, we can pinpoint the exact issue.

## Summary

**Most common fix:**
1. Find your repository name
2. Update `vite.config.js` base path to match
3. Commit and push
4. Wait for deployment

Your site should then work at:
```
https://<username>.github.io/<YOUR-REPO-NAME>/
```
