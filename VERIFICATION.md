# Verification status

## Checked

- Reviewed the linked upstream API's route definitions and song response model.
- Verified that `https://saavn.sumit.co/api/search/songs?query=lofi&limit=1` returned a successful response with song metadata, images, and playable-source URLs matching the client model.
- Confirmed Node.js 24 and Chromium were available on the initially reachable Kali host.
- Reviewed source for request cancellation, URL validation, storage recovery, server path handling, and responsive controls.

## Not yet executed

Dependency installation, TypeScript compilation, the production build, browser regression tests, and real music playback have **not** been run. Kali became unreachable before project transfer. This session's terminal instructions permit commands only through Kali, so Windows execution must be initiated by the user.

The application is supplied as source with a Windows launcher; it is not claimed to be running or to have passed automated tests.

## Validate on Windows

Double-click `START-NOIR.cmd` to install, build, and serve the app. The script stops and displays any installation/build/startup error.

For the regression suite, open a terminal in this folder:

```sh
npm run build
npx playwright install chromium
npm test
```

The suite covers:

1. Debounced searches, stale request cancellation, pagination, empty results, API errors, and retry recovery.
2. Liked songs and custom playlists surviving reload, and removing songs from a playlist.
3. Actual HTML audio playback using a generated WAV fixture: time advancement, pause, seek, volume, track changes, repeat, queue selection, and navigation continuity.
4. Settings persistence, Escape dismissal, and keyboard search focus.
5. Mobile navigation, playback, playlist creation, and horizontal overflow checks.
6. Recovery from malformed saved library data.

For live integration, search for a song, play it, confirm the playback timer advances and audio is audible, and check next/previous and quality settings. Public API/CDN availability can differ from deterministic test results.
