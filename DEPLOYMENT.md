# Deployment Guide

This guide explains how to deploy the Compose Flow MVP as a static site to GitHub Pages.

## Prerequisites

- GitHub repository for this project
- GitHub account with permissions to enable GitHub Pages
- Code pushed to the `main` branch

## Quick Setup

### 1. Enable GitHub Pages

1. Go to your repository on GitHub
2. Click **Settings** → **Pages** (in left sidebar)
3. Under "Build and deployment":
   - **Source**: Select "GitHub Actions"
4. Click **Save**

That's it! The workflow is already configured.

### 2. Push to Main Branch

```bash
git add .
git commit -m "Add GitHub Pages deployment"
git push origin main
```

The GitHub Action will automatically:
1. Build the app
2. Deploy to GitHub Pages
3. Make it available at `https://<username>.github.io/compose-flow-mvp/`

### 3. Access Your Site

After the workflow completes (usually 1-2 minutes):

**URL**: `https://<username>.github.io/compose-flow-mvp/`

Replace `<username>` with your GitHub username.

## How It Works

### GitHub Actions Workflow

The workflow (`.github/workflows/deploy.yml`) runs on:
- Every push to `main` branch
- Manual trigger (workflow_dispatch)

**Build job:**
1. Checks out code
2. Sets up Node.js 20
3. Installs dependencies (`npm ci`)
4. Builds the app with `GITHUB_PAGES=true` environment variable
5. Uploads the `dist/` folder as an artifact

**Deploy job:**
1. Takes the build artifact
2. Deploys to GitHub Pages
3. Returns the deployment URL

### Vite Configuration

The `vite.config.js` includes:

```javascript
base: process.env.GITHUB_PAGES ? "/compose-flow-mvp/" : "/",
```

This ensures:
- **Development**: Base path is `/` (localhost:5173)
- **GitHub Pages**: Base path is `/compose-flow-mvp/` (correct asset paths)

### Repository Name

⚠️ **Important**: If your repository name is different from `compose-flow-mvp`, update `vite.config.js`:

```javascript
base: process.env.GITHUB_PAGES ? "/your-repo-name/" : "/",
```

Replace `your-repo-name` with your actual repository name.

## Manual Deployment

You can trigger deployment manually without pushing:

1. Go to **Actions** tab on GitHub
2. Select "Deploy to GitHub Pages" workflow
3. Click **Run workflow** → **Run workflow**

## Deployment Status

### Check Deployment Status

1. Go to **Actions** tab on GitHub
2. Click on the latest workflow run
3. View build and deploy logs

### View Live Site

1. Go to **Settings** → **Pages**
2. The URL is shown at the top: "Your site is live at..."
3. Click "Visit site"

## Troubleshooting

### Assets not loading (404 errors)

**Symptom**: Page loads but CSS/JS/images return 404

**Cause**: Incorrect base path in `vite.config.js`

**Fix**: Ensure the base path matches your repository name:
```javascript
base: process.env.GITHUB_PAGES ? "/compose-flow-mvp/" : "/",
```

### Workflow fails on "npm ci"

**Symptom**: Workflow fails during dependency installation

**Cause**: `package-lock.json` out of sync or corrupted

**Fix**:
```bash
rm package-lock.json
npm install
git add package-lock.json
git commit -m "Regenerate package-lock.json"
git push
```

### Workflow fails on "npm run build"

**Symptom**: Build step fails

**Cause**: Build error in code

**Fix**:
1. Test build locally: `npm run build`
2. Fix any errors
3. Commit and push

### Page shows 404

**Symptom**: GitHub Pages URL shows 404 error

**Cause**: GitHub Pages not enabled or deployment failed

**Fix**:
1. Check **Settings** → **Pages** → Source is "GitHub Actions"
2. Check **Actions** tab for failed workflows
3. Review workflow logs for errors

### Old version showing

**Symptom**: Changes not visible on live site

**Cause**: Browser cache

**Fix**:
- Hard refresh: `Ctrl+Shift+R` (Windows/Linux) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Try incognito/private window

## Custom Domain (Optional)

To use a custom domain:

1. **Add CNAME record** in your DNS settings:
   ```
   CNAME  www  <username>.github.io
   ```

2. **Configure in GitHub**:
   - Go to **Settings** → **Pages**
   - Enter your custom domain
   - Enable "Enforce HTTPS"

3. **Update vite.config.js**:
   ```javascript
   base: process.env.GITHUB_PAGES ? "/" : "/",
   ```

## Local Testing

To test the production build locally:

```bash
# Build with GitHub Pages base path
GITHUB_PAGES=true npm run build

# Preview the build
npm run preview
```

**Note**: The base path will be `/compose-flow-mvp/`, so some links may not work locally. This is expected.

To test without the base path:

```bash
npm run build
npm run preview
```

## Environment Variables

The workflow uses the `GITHUB_PAGES` environment variable to conditionally set the base path.

**In workflow** (`.github/workflows/deploy.yml`):
```yaml
env:
  GITHUB_PAGES: true
```

**In config** (`vite.config.js`):
```javascript
base: process.env.GITHUB_PAGES ? "/compose-flow-mvp/" : "/",
```

## Deployment Frequency

The site will automatically redeploy whenever you:
- Push to `main` branch
- Merge a pull request to `main`
- Manually trigger the workflow

**Build time**: ~1-2 minutes
**Cache**: GitHub Actions caches `node_modules` for faster builds

## Security

The workflow uses minimal permissions:
- `contents: read` - Read repository contents
- `pages: write` - Write to GitHub Pages
- `id-token: write` - Required for deployment

No secrets or personal access tokens are needed.

## Branch Protection (Optional)

To prevent accidental deployments:

1. Go to **Settings** → **Branches**
2. Add rule for `main` branch
3. Enable:
   - "Require pull request reviews before merging"
   - "Require status checks to pass before merging"
   - Select "build" as required check

Now every PR must pass the build before merging.

## Monitoring

### View Deployment History

1. Go to **Deployments** (right sidebar on repository home)
2. Click "github-pages"
3. View all deployments with timestamps and status

### View Build Logs

1. Go to **Actions** tab
2. Click on any workflow run
3. Expand "build" or "deploy" job
4. View detailed logs

## Alternative: Manual Static Hosting

If you prefer not to use GitHub Pages:

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Deploy `dist/` folder to**:
   - Netlify
   - Vercel
   - Cloudflare Pages
   - AWS S3 + CloudFront
   - Any static hosting service

3. **Configuration**:
   - Set base path to `/` in `vite.config.js`
   - Most providers auto-detect Vite apps

## Summary

Deploying to GitHub Pages is simple:

1. ✅ **Workflow already configured** - `.github/workflows/deploy.yml`
2. ✅ **Vite configured for GitHub Pages** - `vite.config.js`
3. ✅ **Enable GitHub Pages** - Settings → Pages → Source: GitHub Actions
4. ✅ **Push to main** - Automatic deployment
5. ✅ **Visit site** - `https://<username>.github.io/compose-flow-mvp/`

The site will auto-update on every push to `main`. No manual steps required after initial setup.

## Next Steps

After deployment:

- Share the URL with your team
- Add the URL to your repository description
- Link to it in your README.md
- Create a QR code for easy mobile access
- Set up custom domain (optional)

Enjoy your live Compose Flow MVP visualizer! 🚀
