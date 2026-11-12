import { createRequire } from 'node:module';
import { existsSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { homedir } from 'node:os';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
let formatter;
try {
  formatter = join(dirname(require.resolve('prettier/package.json')), 'bin', 'prettier.cjs');
} catch {
  // Use the existing editor installation when the npm registry is unavailable.
  const extensions = join(homedir(), '.vscode', 'extensions');
  if (existsSync(extensions)) {
    const candidates = readdirSync(extensions)
      .filter((name) => name.startsWith('esbenp.prettier-vscode-'))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    for (const extension of candidates) {
      const candidate = join(
        extensions,
        extension,
        'node_modules',
        'prettier',
        'bin',
        'prettier.cjs',
      );
      if (existsSync(candidate)) {
        formatter = candidate;
        break;
      }
    }
  }
}
if (!formatter) {
  console.error(
    'Prettier was not found. Run npm install --save-dev prettier, or install the recommended Prettier VS Code extension.',
  );
  process.exit(1);
}
const result = spawnSync(process.execPath, [formatter, ...process.argv.slice(2)], {
  stdio: 'inherit',
});
if (result.error) console.error(result.error.message);
process.exit(result.status ?? 1);
