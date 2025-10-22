import { execSync } from 'node:child_process';
import { cpSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(new URL('.', import.meta.url).pathname, '..');

try {
  rmSync(resolve(root, 'dist'), { recursive: true, force: true });
} catch (error) {
  // ignore
}

execSync('tsc --project tsconfig.json', { stdio: 'inherit', cwd: root });
cpSync(resolve(root, 'public'), resolve(root, 'dist'), { recursive: true });

console.log('Build complete.');
