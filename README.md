# Mini Apps

Monorepo with two Next.js apps:

| App | Folder | Dev port | Description |
|-----|--------|----------|-------------|
| **Mini Apps Dashboard** | [`mini-apps-dashboard/`](mini-apps-dashboard/) | `3000` | Employee / Figma-style home, AI News Briefing journey |
| **AI News Briefing** | [`ai-news-briefing/`](ai-news-briefing/) | `3001` | Audio briefings (Akshay & Kriti), NewsAPI, TTS |

## Quick start

```bash
# Dashboard + briefing together (recommended)
cd mini-apps-dashboard
npm install
npm install --prefix ../ai-news-briefing
cp ../ai-news-briefing/.env.example ../ai-news-briefing/.env.local   # fill keys
cp .env.example .env.local   # e.g. AI_NEWS_BRIEFING_URL=http://127.0.0.1:3001
npm run dev:all
```

- Dashboard: http://127.0.0.1:3000  
- Briefing API: http://127.0.0.1:3001  

See each app’s **README** for env vars (NewsAPI, OpenAI, ElevenLabs, Supabase, etc.).

## Repo

<https://github.com/sharmarohit184511/miniapps>
