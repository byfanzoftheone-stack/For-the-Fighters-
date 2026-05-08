# Lion Heart Fights Migration: Netlify Build -> Railway + Vercel

This repo now contains:
- `legacy_build/`: extracted static frontend build.
- `railway-api/`: Node/Express API for Anthropic-powered AI endpoints.

## 1) Railway backend deploy

1. In Railway, create a new project from this GitHub repo.
2. Set the Railway service root directory to `railway-api`.
3. Add env vars:
   - `ANTHROPIC_API_KEY` = your key
   - `ANTHROPIC_MODEL` = `claude-3-5-sonnet-20241022` (or preferred model)
   - `MAX_TOKENS` = `900`
   - `CORS_ORIGIN` = `https://your-vercel-project.vercel.app,http://localhost:4173`
4. Deploy. Confirm health endpoint works:
   - `https://<railway-domain>/health`

## 2) Vercel frontend deploy

1. Import this repo into Vercel.
2. Keep root directory as repository root.
3. `vercel.json` rewrites all traffic to `legacy_build/`.
4. Edit `legacy_build/index.html` and set:
   - `window.LIONHEART_API_BASE_URL` to your Railway HTTPS URL.
5. Deploy to production.

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
