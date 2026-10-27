# NOIR — Find your frequency

A responsive black-and-white glass music app built with React, TypeScript, and Vite. Music discovery and streaming use [sumitkolhe/jiosaavn-api](https://github.com/sumitkolhe/jiosaavn-api).

## Start on Windows

1. Install the current **Node.js LTS** release from <https://nodejs.org/> if it is not already installed (22.14+ required).
2. Open this project folder and double-click **`START-NOIR.cmd`**.
3. The launcher installs dependencies, builds the app, starts the server, and opens **<http://localhost:5173>** in your default browser.

Keep the launcher window open while listening. Press `Ctrl+C` in that window to stop the server. The first launch requires internet access to install packages. Music search and streaming also require internet access.

## Run from a terminal

Requires Node.js 22.14+ and npm.

```sh
npm install
npm run build
npm start
```

Open `http://localhost:5173`. The server binds to `0.0.0.0`, so other devices on the same network can open `http://YOUR_MACHINE_IP:5173`.

For development, use `npm run dev` instead. Both the development and production servers forward `/api` requests to the configured JioSaavn API. Audio streams play directly from the URLs returned by that API.

## API configuration

Copy `.env.example` to `.env` and set:

```dotenv
SAAVN_API_URL=https://saavn.sumit.co
PORT=5173
HOST=0.0.0.0
```

`SAAVN_API_URL` is the instance's origin, **without `/api`**. You can deploy the linked repository with its Docker, Vercel, or Cloudflare instructions and enter your own instance's address here. Restart the server after changing configuration. The repository's older `saavn.dev` address was not resolving during setup; `saavn.sumit.co` was verified to return the expected API schema.

Use `npm start` for production, rather than `vite preview`: the included Node server supplies both static assets and the API proxy. No API key is required by the default public instance. Streaming availability depends on the API, the track, and the media CDN.

## Features

- Responsive monochrome UI, frosted glass panels, full-color song covers, monochrome editorial cards, and reduced-motion support.
- Live, debounced search with pagination, cancellation, loading states, retry controls, and meaningful empty states.
- Curated mood collections and language discovery. Mood collections are live searches; they are not official JioSaavn playlists or personalized recommendations.
- Persistent audio player, seeking, volume, mute, shuffle, repeat, queue, and now-playing dialog.
- Browser media-session controls where supported.
- Liked songs, custom playlists, and recently played tracks stored in localStorage on this browser/device.
- Configurable stream quality: up to 320, 160, or 96 kbps, depending on the song.
- Keyboard shortcuts: `/` focuses search; `Space` toggles playback when not interacting with a form or button.

## Checks

```sh
npm run build
npm test
```

On Windows, install the test browser once with `npx playwright install chromium`. On Kali, the suite uses `/usr/bin/chromium`. Set `CHROMIUM_PATH` to a different executable, or set `PLAYWRIGHT_BUNDLED_BROWSER=1` to use Playwright's installed browser on Linux. The tests use deterministic API/audio fixtures to check playback, searching, library persistence, queue controls, failure recovery, and mobile layout without depending on the public API's uptime. See `VERIFICATION.md` for the current verification status.

## Project layout

```text
src/App.tsx              Navigation, discovery, library, dialogs
src/components/         Player, track list, artwork, accessible dialog
src/hooks/              Catalog requests and audio state
src/lib/                API client, collection definitions, local persistence
src/styles.css          Responsive monochrome glass design
public/                 Original SVG artwork and fallback covers
scripts/serve.mjs        Production static server and API proxy
tests/                  Browser regression tests
```

The JioSaavn API is a separate MIT-licensed project by Sumit Kolhe. Editorial photos are loaded from Unsplash; album artwork and music metadata come from JioSaavn. Local fallback covers keep the interface usable when image hosts cannot be reached.
