import { readdir, readFile, writeFile } from 'fs/promises';
import { join, extname } from 'path';

const isLocalImport = (line) =>
  line.includes('from "./') || line.includes("from './") || 
  line.includes('from "../') || line.includes("from '../");

async function fixFile(filePath) {
  let content = await readFile(filePath, 'utf-8');
  let lines = content.split('\n');

  let modified = false;
  lines = lines.map(line => {
    if (isLocalImport(line) && !line.includes('.js"') && !line.includes('.js\'')) {
      modified = true;
      return line.replace(/from (['"])(\.{1,2}\/[^'"]+)(['"])/, 'from $1$2.js$3');
    }
    return line;
  });

  if (modified) {
    await writeFile(filePath, lines.join('\n'));
    console.log('Fixed imports in', filePath);
  }
}

async function scanDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      await scanDir(fullPath);
    } else if (extname(entry.name) === '.ts') {
      await fixFile(fullPath);
    }
  }
}

// Start from src/
await scanDir('./Backend/src');
