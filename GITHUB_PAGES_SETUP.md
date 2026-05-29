# GitHub Pages Setup Checklist

Quick reference for deploying this project to GitHub Pages.

## ✅ Pre-Setup (Already Done)

These are already configured in the repository:

- [x] GitHub Actions workflow (`.github/workflows/deploy.yml`)
- [x] Vite configuration for base path (`vite.config.js`)
- [x] Build configuration with code splitting
- [x] Static assets in `public/` directory
- [x] `.gitignore` configured

## 🚀 Setup Steps (Do This Once)

### Step 1: Create GitHub Repository

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial commit: Compose Flow MVP with GitHub Pages support"

# Create repository on GitHub, then:
git remote add origin https://github.com/<username>/compose-flow-mvp.git
git branch -M main
git push -u origin main
```

### Step 2: Enable GitHub Pages

1. Go to your repository on GitHub: `https://github.com/<username>/compose-flow-mvp`
2. Click **Settings** (top menu)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source**: Select **"GitHub Actions"** (not "Deploy from a branch")
5. No need to click Save - it auto-saves

### Step 3: Trigger First Deployment

The workflow will automatically run when you push to `main`. To trigger it now:

**Option A: Push a commit**
```bash
git push origin main
```

**Option B: Manual trigger**
1. Go to **Actions** tab on GitHub
2. Click "Deploy to GitHub Pages" workflow
3. Click "Run workflow" → "Run workflow"

### Step 4: Wait for Deployment

1. Go to **Actions** tab
2. Watch the workflow progress (usually 1-2 minutes)
3. Green checkmark = success ✅

### Step 5: Access Your Site

Your site will be available at:

```
https://<username>.github.io/compose-flow-mvp/
```

Replace `<username>` with your GitHub username.

## 📋 Verification Checklist

After setup, verify:

- [ ] Repository exists on GitHub
- [ ] Code pushed to `main` branch
- [ ] GitHub Pages enabled (Settings → Pages → Source: GitHub Actions)
- [ ] Workflow ran successfully (Actions tab shows green checkmark)
- [ ] Site loads at `https://<username>.github.io/compose-flow-mvp/`
- [ ] Files load correctly (no upload button visible)
- [ ] "Load Complex Example" button works
- [ ] Both examples load and render

## 🔧 Configuration Notes

### Repository Name

The workflow assumes the repository is named `compose-flow-mvp`.

**If your repository has a different name:**

1. Edit `vite.config.js`:
   ```javascript
   base: process.env.GITHUB_PAGES ? "/YOUR-REPO-NAME/" : "/",
   ```

2. Rebuild and push:
   ```bash
   git add vite.config.js
   git commit -m "Update base path for repository name"
   git push
   ```

### Branch Name

The workflow triggers on pushes to `main`.

**If you use a different default branch** (e.g., `master`):

1. Edit `.github/workflows/deploy.yml`:
   ```yaml
   on:
     push:
       branches:
         - master  # Change from 'main'
   ```

2. Commit and push:
   ```bash
   git add .github/workflows/deploy.yml
   git commit -m "Update workflow branch"
   git push
   ```

## 🎯 Common Tasks

### View Deployment Status

1. Go to repository **Actions** tab
2. Click on the latest workflow run
3. View "build" and "deploy" job logs

### View Deployment History

1. Go to repository home page
2. Click **Deployments** (right sidebar)
3. Click "github-pages"
4. See all deployments with timestamps

### Redeploy

Just push to `main`:
```bash
git push origin main
```

Or manually trigger from Actions tab.

### Update Site Content

1. Make changes locally
2. Test: `npm run dev`
3. Commit and push:
   ```bash
   git add .
   git commit -m "Update content"
   git push
   ```

Site auto-updates in 1-2 minutes.

## 🐛 Troubleshooting

### Workflow doesn't run

- Check **Actions** tab is not disabled (Settings → Actions → "Allow all actions")
- Check workflow file is in `.github/workflows/deploy.yml`
- Check you pushed to `main` branch

### Build fails

1. Test locally:
   ```bash
   GITHUB_PAGES=true npm run build
   ```
2. Fix errors
3. Push again

### Site shows 404

- Wait a few minutes (GitHub Pages can take time to activate)
- Check Settings → Pages shows "Your site is live"
- Verify workflow succeeded (Actions tab)

### Assets not loading

- Check browser console for errors
- Verify base path in `vite.config.js` matches repository name
- Hard refresh: `Ctrl+Shift+R`

## 📚 Additional Resources

- [DEPLOYMENT.md](DEPLOYMENT.md) - Full deployment guide
- [GitHub Pages Documentation](https://docs.github.com/pages)
- [GitHub Actions Documentation](https://docs.github.com/actions)

## 💡 Tips

- **Testing**: Test builds locally before pushing
- **Caching**: Workflow caches dependencies for faster builds
- **Automation**: Every push to `main` auto-deploys
- **Free**: GitHub Pages is free for public repositories
- **SSL**: HTTPS is automatically enabled
- **Speed**: Deployment takes 1-2 minutes

## ✨ Next Steps

After successful deployment:

- [ ] Add URL to repository description
- [ ] Update README with live demo link
- [ ] Share with team
- [ ] Consider custom domain (optional)
- [ ] Set up branch protection (optional)

## 🎉 You're Done!

Your Compose Flow MVP is now live on GitHub Pages!

Visit: `https://<username>.github.io/compose-flow-mvp/`
