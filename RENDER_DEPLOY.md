# Deploy on Render

## Your service still uses Root Directory `src`?

The repo includes **`src/package.json`** as a **shim**: install + build run against `mini-apps-dashboard/`, and **Start** runs the dashboard. You should still fix Render properly (below) so you don’t depend on this.

## Error: `Could not read package.json` under `.../src/package.json`

That happens when **Root Directory** is set to `src` but there was no `package.json` there. The real app is in **`mini-apps-dashboard/`**.

### Monorepo (repo has `mini-apps-dashboard/` at the root)

1. **Root Directory:** `mini-apps-dashboard`
2. **Build Command:** `npm ci && npm run build` (or `yarn install && yarn build`)
3. **Start Command:** `npm run start` (or `yarn start`)

Or connect the repo using the root **`render.yaml`** (Blueprint) and sync the service from that file.

### Repo is only the dashboard (no `mini-apps-dashboard` folder)

1. **Root Directory:** leave **empty** (repository root), **not** `src`
2. **Build Command:** `npm ci && npm run build`
3. **Start Command:** `npm run start`

Commit **`package-lock.json`** (or `yarn.lock`) so installs are reproducible on Render.
