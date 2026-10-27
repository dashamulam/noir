import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { spawn } from 'node:child_process';
import { networkInterfaces } from 'node:os';

const root = fileURLToPath(new URL('../', import.meta.url));
if (existsSync(resolve(root, '.env'))) process.loadEnvFile(resolve(root, '.env'));
const dist = resolve(root, 'dist');
const upstream = (process.env.SAAVN_API_URL || 'https://saavn.sumit.co').replace(/\/$/, '');
const port = Number(process.env.PORT) || 5173;
const host = process.env.HOST || '0.0.0.0';
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

if (!existsSync(resolve(dist, 'index.html'))) {
  console.error('Build the app first with npm run build.');
  process.exit(1);
}

createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end('Method not allowed');
    return;
  }
  try {
    const url = new URL(req.url || '/', 'http://localhost');
    if (url.pathname.startsWith('/api/')) {
      if (!/^\/api\/(search(?:\/(songs|albums|artists|playlists))?|songs(?:\/[^/]+(?:\/(suggestions|lyrics))?)?|albums|artists(?:\/[^/]+(?:\/(songs|albums))?)?|playlists)$/.test(url.pathname)) {
        res.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: false, message: 'Unknown API route' }));
        return;
      }
      const controller = new AbortController();
      res.on('close', () => { if (!res.writableEnded) controller.abort(); });
      const response = await fetch(`${upstream}${url.pathname}${url.search}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(25000)]), headers: { Accept: 'application/json' } });
      res.writeHead(response.status, { 'Content-Type': response.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' });
      if (req.method === 'HEAD' || !response.body) { await response.body?.cancel(); res.end(); }
      else Readable.fromWeb(response.body).on('error', () => res.destroy()).pipe(res);
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    let file = resolve(dist, `.${pathname}`);
    if (!file.startsWith(dist + sep) && file !== dist) { res.writeHead(403).end('Forbidden'); return; }
    if (!existsSync(file) || !statSync(file).isFile()) {
      if (extname(pathname)) { res.writeHead(404).end('Not found'); return; }
      file = resolve(dist, 'index.html');
    }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream', 'Cache-Control': file.includes(`${sep}assets${sep}`) ? 'public, max-age=31536000, immutable' : 'no-cache' });
    if (req.method === 'HEAD') res.end();
    else createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch (error) {
    if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ success: false, message: 'The music service is temporarily unavailable.' }));
    else res.destroy();
    console.error('Request failed:', error instanceof Error ? error.message : error);
  }
}).listen(port, host, () => {
  const localUrl = `http://localhost:${port}`;
  console.log(`NOIR is ready at ${localUrl} (API: ${upstream})`);
  console.log(`Listening on ${host}:${port}. Press Ctrl+C to stop.`);
  if (host === '0.0.0.0' || host === '::') {
    for (const addresses of Object.values(networkInterfaces())) {
      for (const address of addresses || []) {
        if (address.family === 'IPv4' && !address.internal) console.log(`On your phone (same Wi-Fi): http://${address.address}:${port}`);
      }
    }
  }
  if (process.env.NOIR_OPEN_BROWSER === '1' && process.platform === 'win32') {
    const browser = spawn('cmd.exe', ['/c', 'start', '""', localUrl], { detached: true, stdio: 'ignore', windowsHide: true });
    browser.on('error', () => console.log(`Open ${localUrl} in your browser.`));
    browser.unref();
  }
});
