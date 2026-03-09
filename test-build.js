#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Building Next.js app...\n');

try {
  execSync('npm run build', {
    cwd: path.resolve(__dirname),
    stdio: 'inherit',
  });
  console.log('\n✅ Build successful!');
  process.exit(0);
} catch (err) {
  console.error('\n❌ Build failed');
  process.exit(1);
}
