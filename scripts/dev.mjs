import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { exec } from 'node:child_process';

const root = resolve(new URL('.', import.meta.url).pathname, '..');

function build() {
  return new Promise<void>((resolveBuild, reject) => {
    exec('node ./scripts/build.mjs', { cwd: root }, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
        reject(error);
        return;
      }
      console.log(stdout);
      resolveBuild();
    });
  });
}

const mime = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
};

await build();

const server = createServer(async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url ?? '/index.html';
  const filePath = join(root, 'dist', url);
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      const html = await readFile(join(filePath, 'index.html'));
      res.setHeader('Content-Type', 'text/html');
      res.end(html);
      return;
    }
    const ext = extname(filePath);
    const contentType = mime[ext] ?? 'application/octet-stream';
    const file = await readFile(filePath);
    res.setHeader('Content-Type', contentType);
    res.end(file);
  } catch (error) {
    res.statusCode = 404;
    res.end('Not found');
  }
});

const port = Number(process.env.PORT ?? 4173);
server.listen(port, () => {
  console.log(`Dev server running at http://localhost:${port}`);
});
