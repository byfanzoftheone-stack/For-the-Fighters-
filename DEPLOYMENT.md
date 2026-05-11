# Lion Heart Fights Migration: Netlify -> Railway + Vercel

This repo contains:
- `legacy_build/`: extracted static frontend build.
- `railway-api/`: Node/Express API for Anthropic-powered AI endpoints.

## 0) Netlify cutover checklist

If this project was previously hosted on Netlify, do this before final cutover:

1. Keep Netlify live until both Railway and Vercel are verified healthy.
2. In Netlify, disable auto-publish for this repo to avoid split deployments.
3. Move DNS to Vercel after successful Vercel + Railway smoke tests.
4. Netlify config has been removed from this repo because production now runs on Vercel + Railway.

## 1) Railway backend deploy

1. In Railway, create a new project from this GitHub repo.
2. Set the Railway service root directory to `railway-api`.
3. Add env vars:
   - `ANTHROPIC_API_KEY` = your key
   - `ANTHROPIC_MODEL` = `claude-3-5-sonnet-20241022` (or preferred model)
   - `MAX_TOKENS` = `900`
   - `CORS_ORIGIN` = `https://your-vercel-project.vercel.app,https://*.vercel.app,http://localhost:4173`
4. Deploy. Confirm health endpoint works:
   - `https://<railway-domain>/health`

## 2) Vercel frontend deploy

1. Import this repo into Vercel.
2. Keep root directory as repository root.
3. Add Vercel env var:
   - `RAILWAY_API_BASE_URL` = `https://<your-active-railway-domain>`
4. `vercel.json` serves `legacy_build/` and rewrites `/health` to `/api/health`.
5. `api/[...path].js` proxies all `/api/*` requests from Vercel to Railway using `RAILWAY_API_BASE_URL`.
6. Deploy to production.

## 3) API endpoints now available

- `GET /health`
- `POST /api/ai/chat`
  - Body: `{ "message": "...", "context": "optional" }`
- `POST /api/ai/analyze`
  - Body: `{ "opponentNotes": "...", "fighterStyle": "optional" }`

## 4) Local development

```bash
cd railway-api
cp .env.example .env
npm install
npm run dev
```

Then set `window.LIONHEART_API_BASE_URL` in `legacy_build/index.html` to `http://localhost:8080` for local testing.

## 5) Post-deploy smoke test

1. Frontend loads at your Vercel domain.
2. `GET https://<railway-domain>/health` returns `{ "ok": true, ... }`.
3. AI widget appears and returns a response for a short test prompt.
4. Browser network tab shows calls to your Railway domain (not Netlify).
