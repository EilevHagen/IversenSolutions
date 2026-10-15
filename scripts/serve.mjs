import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';

const root = resolve('dist');
const port = Number(process.env.PORT || 4173);
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (request, response) => {
  let path;
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    path = resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
  } catch (error) {
    if (error instanceof URIError || error instanceof TypeError) {
      response.writeHead(400).end('Bad request');
      return;
    }
    throw error;
  }
  if (!path.startsWith(root + sep)) {
    response.writeHead(403).end('Forbidden');
    return;
  }
  try {
    const content = await readFile(path);
    response.writeHead(200, {
      'Content-Type': contentTypes[extname(path)] || 'application/octet-stream',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(content);
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') {
      response.writeHead(404).end('Not found');
      return;
    }
    console.error('Unable to serve file:', error);
    response.writeHead(500).end('Internal server error');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Preview ready at http://127.0.0.1:${port}`);
});
