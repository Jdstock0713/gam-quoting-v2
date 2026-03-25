# Compulife API Proxy (Render)

Simple Express proxy that forwards requests to `compulifeapi.com` from a **static IP**.

## Why this exists

Compulife locks API auth IDs to a specific IP address. Vercel serverless functions
use dynamic IPs that change without warning, breaking the integration with 401 errors.
This proxy runs on Render with a static outbound IP, so the IP never changes.

## Deploy to Render

1. Create a new **Web Service** on Render
2. Connect this repo, set root directory to `compulife-proxy/`
3. Settings:
   - **Name**: `gam-compulife-proxy`
   - **Runtime**: Node
   - **Build command**: `npm install`
   - **Start command**: `npm start`
4. Deploy and note the URL (e.g. `https://gam-compulife-proxy.onrender.com`)
5. Hit `https://gam-compulife-proxy.onrender.com/ip` to get the static outbound IP
6. **Contact Compulife** and ask them to lock auth ID `818BEFD20` to that IP

## Connect to Vercel app

Add this environment variable in Vercel project settings:

```
COMPULIFE_PROXY_URL=https://gam-compulife-proxy.onrender.com
```

## Local development

For local dev, don't set `COMPULIFE_PROXY_URL` — the app will call Compulife directly.
This works fine from your local IP (or you can run this proxy locally on port 3002).

## Endpoints

- `GET /` — health check
- `GET /health` — health check
- `GET /ip` — shows the outbound IP that Compulife sees (use this to verify the static IP)
- `GET /*` — proxied to `https://www.compulifeapi.com/api/*`
