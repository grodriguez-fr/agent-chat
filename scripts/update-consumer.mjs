import { readFileSync, writeFileSync, copyFileSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const [directory, archive, version, manager] = process.argv.slice(2);
const stableVersion = /^\d+\.\d+\.\d+$/;
if (!directory || !archive || !stableVersion.test(version) || !['npm', 'npm-legacy', 'pnpm'].includes(manager)) {
  throw new Error('Usage: update-consumer.mjs directory archive X.Y.Z npm|npm-legacy|pnpm');
}
const app = resolve(directory);
const source = resolve(archive);
const manifestPath = resolve(app, 'package.json');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const dependency = '@grodriguez-fr/agent-chat';
const previous = manifest.dependencies?.[dependency];
const previousMatch = /^file:vendor\/agent-chat-(\d+\.\d+\.\d+)\.tgz$/.exec(previous ?? '');
if (!previousMatch) throw new Error('Expected an existing versioned vendor archive dependency');

const metadata = spawnSync('tar', ['-xOf', source, 'package/package.json'], { encoding: 'utf8' });
if (metadata.status !== 0) throw new Error('Cannot read the release archive metadata');
const pkg = JSON.parse(metadata.stdout);
if (pkg.name !== dependency || pkg.version !== version || basename(source) !== `agent-chat-${version}.tgz`) {
  throw new Error('Release archive does not match its advertised name and version');
}
const comparison = version.split('.').map(Number)
  .map((part, index) => part - Number(previousMatch[1].split('.')[index]))
  .find((part) => part !== 0) ?? 0;
if (comparison < 0) {
  console.log(`Keep newer installed version ${previousMatch[1]}; no downgrade.`);
  process.exit(0);
}
if (comparison === 0) {
  const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
  if (hash(source) !== hash(resolve(app, previous.slice(5)))) {
    throw new Error('A published version must not replace an archive with different contents');
  }
  console.log(`Already using ${version}; no update required.`);
  process.exit(0);
}

const destination = resolve(app, `vendor/agent-chat-${version}.tgz`);
mkdirSync(dirname(destination), { recursive: true });
copyFileSync(source, destination);
manifest.dependencies[dependency] = `file:vendor/agent-chat-${version}.tgz`;
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
const command = manager === 'pnpm' ? 'pnpm' : 'npm';
const args = manager === 'pnpm'
  ? ['install', '--lockfile-only', '--ignore-scripts']
  : ['install', '--package-lock-only', '--ignore-scripts', ...(manager === 'npm-legacy' ? ['--legacy-peer-deps'] : [])];
const result = process.platform === 'win32'
  ? spawnSync('cmd.exe', ['/d', '/c', command, ...args], { cwd: app, stdio: 'inherit' })
  : spawnSync(command, args, { cwd: app, stdio: 'inherit' });
if (result.status !== 0) throw new Error('Lockfile update failed; do not create a PR');
rmSync(resolve(app, previous.slice(5)));
console.log(`Prepared agent-chat ${previousMatch[1]} -> ${version}`);
