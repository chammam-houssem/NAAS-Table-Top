import { execSync } from 'node:child_process';

try {
  execSync('tsc --noEmit --project tsconfig.json', { stdio: 'inherit' });
  console.log('TypeScript checks passed.');
} catch (error) {
  process.exit(1);
}
