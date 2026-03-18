# Mini Apps Dashboard

The **Figma employee-home** screen is the main entry at `/` (AI News Briefing widget + **Open full app** in the header). The mini-apps grid is no longer the landing page. The standalone briefing app can link back to this home URL.

## Troubleshooting: nothing on :3000 / :3001

Dev uses **`-H 127.0.0.1`** so Next.js does not call `os.networkInterfaces()` (that can throw on some Mac/Node setups and **kill the dev server** before it listens).

- Open **http://127.0.0.1:3000** (home / Figma screen) and **http://127.0.0.1:3001** (briefing). `http://localhost:…` usually works too once the server is up.
- If you see **EMFILE: too many open files**, run `ulimit -n 10240` in the same terminal, then `npm run dev` again.

## Run dashboard + AI News Briefing together

1. Copy `.env.example` to `.env.local` and set:

   ```env
   NEXT_PUBLIC_AI_NEWS_BRIEFING_URL=http://localhost:3001
   ```

2. From this folder, start **both** apps:

   ```bash
   npm run dev:all
   ```

   - **Home (Figma design):** [http://localhost:3000](http://localhost:3000) → `/`
   - **AI News Briefing:** [http://localhost:3001](http://localhost:3001) (the briefing app’s `dev` script uses port **3001** so it always matches the dashboard.)

   If the News feed says the briefing app is unreachable, confirm the **briefing** line in the terminal shows `Ready` for **:3001**, or run `cd ../ai-news-briefing && npm run dev` in a separate terminal.

3. Use **Open full app ↗** on the home screen to open the briefing app in a new tab (iframe widget is on the Figma home).

### Run only this app (no briefing server)

```bash
npm run dev
```

(Uses port **3000**. Briefing embed will only work if `NEXT_PUBLIC_AI_NEWS_BRIEFING_URL` points to a running briefing server.)

## Deploy

Set `NEXT_PUBLIC_AI_NEWS_BRIEFING_URL` to your deployed briefing URL. On the **briefing** app, set `DASHBOARD_EMBED_ORIGINS` to your dashboard origin(s) so the iframe is allowed (CSP `frame-ancestors`).
