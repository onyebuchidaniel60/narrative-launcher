import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.join(root, 'src', 'db', 'migrations.sql');
const targetDir = path.join(root, 'dist', 'db');
const target = path.join(targetDir, 'migrations.sql');

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);

console.log(`Copied ${path.relative(root, source)} -> ${path.relative(root, target)}`);
