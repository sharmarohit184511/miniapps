# Deploy on Render

## Error: `Could not read package.json` under `.../src/package.json`

That happens when **Root Directory** is set to `src`. The Next app’s `package.json` is next to the `src` folder (e.g. `mini-apps-dashboard/package.json`), not inside `src/`.

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
