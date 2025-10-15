#!/usr/bin/env node

import { execSync } from 'child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('Building create-nest-architect...');


console.log(' Compiling TypeScript...');
execSync('npx tsc', { stdio: 'inherit' });

console.log(' Setting executable permissions...');
chmodSync('./dist/index.js', 0o755);
console.log(' dist/index.js is now executable');


function copyRecursive(src: string, dest: string): void {
  if (!existsSync(src)) return;
  
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }
  
  const files = readdirSync(src);
  
  for (const file of files) {
    const srcPath = join(src, file);
    const destPath = join(dest, file);
    
    if (statSync(srcPath).isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

console.log(' Copying templates...');
copyRecursive('./src/templates', './dist/templates');

console.log('Build completed successfully!');