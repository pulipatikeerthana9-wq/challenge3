Smoke test for EcoPilot frontend API endpoints

This folder includes `smoke.js` — a small Node script that posts sample payloads to the dev server's API endpoints and prints responses.

How to run (PowerShell / macOS / Linux)

1. Start the dev server from the `frontend` folder:

```bash
cd frontend
npm run dev
```

2. In another terminal, run the smoke test (Node 18+):

```bash
cd frontend
node scripts/smoke.js
```

Expected output: JSON responses for `/api/footprint`, `/api/simulate`, and `/api/coach`.

Enabling Redis for persistent rate limits (optional)

- If you want rate limits to persist across restarts, set `REDIS_URL` in your environment before starting the app. Example:

```bash
# No auth
export REDIS_URL=redis://localhost:6379

# With password (Linux/macOS)
export REDIS_URL=redis://:your_password@redis.example.com:6379
```

On Windows PowerShell, use:

```powershell
$env:REDIS_URL = 'redis://:your_password@redis.example.com:6379'
npm run dev
```

Notes

- The smoke test uses the deterministic fallbacks by default (no `GEMINI_API_KEY` required). If you set `GEMINI_API_KEY` in `frontend/.env.local`, the `/api/coach` and `/api/simulate` endpoints will attempt to call Gemini (with 5s timeout and fallback on failure).
- The rate limiter will use Redis if `REDIS_URL` is present and `ioredis` is installed; otherwise it falls back to an in-memory limiter (resets on restart).
