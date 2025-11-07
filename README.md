# PropertySync Display

Standalone build of the PropertySync welcome-display that previously lived in the `strm` mono–repository.

## Getting Started

```bash
npm install
npm run serve
```

The app is a Vue 2 + Vuetify single-page experience that expects a backend providing the HostSync/PropertySync API.

### Environment Variables

| Variable | Purpose | Default / Notes |
| --- | --- | --- |
| `VUE_APP_DISPLAY_TOKEN` | **Required** display token generated per property in HostSync | No default (rotate per kiosk) |
| `VUE_APP_DISPLAY_SECRET` | **Required** secret paired with the display token | No default (store securely) |
| `VUE_APP_API_URL` | REST endpoint for property/booking data | `http://localhost:8080/api` |
| `VUE_APP_WS_URL` | WebSocket endpoint for realtime updates | `ws://localhost:8080/ws` |

Create a `.env.local` file to override these for local development if you want baked-in defaults. When the kiosk runs, operators can click the gear button in the lower-right corner to enter or rotate the display token/secret; the app persists them locally and uses them for all subsequent API calls.

## Deployment (Netlify)

This repo is structured for direct Netlify builds:

- **Build command:** `npm install && npm run build`
- **Publish directory:** `dist`
- **Node version:** `18`

No base directory is required—`netlify.toml` at the repo root captures the configuration. Once the repo is connected, trigger a deploy manually to validate the build, then enable continuous deployment.

## Optional: Kiosk Setup

The `scripts/setup-kiosk.sh` helper installs Chromium in kiosk mode on a Raspberry Pi and points it at the display URL. Review the script before running it in your environment.


