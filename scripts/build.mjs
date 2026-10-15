import { cp, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

const result = spawnSync(process.execPath, [
  join('node_modules', 'tailwindcss', 'lib', 'cli.js'),
  '--input', 'styles.css', '--output', 'app.css', '--minify',
], { stdio: 'inherit' });

if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

await mkdir('dist', { recursive: true });
await rm(join('dist', 'assets'), { recursive: true, force: true });
for (const file of ['index.html', 'app.css', 'app.js', 'robots.txt', 'sitemap.xml', 'assets']) {
  await cp(file, join('dist', file), { recursive: true });
}
console.log('Static website built in dist.');
