#!/usr/bin/env node
//
// Workaround for yauzl (used by extract-zip) hanging on Node.js v24 when
// decompressing certain entries in the Electron zip file (specifically
// electron.icns). Affects both the electron package's install.js and
// @electron/packager's unzip.js.
//
// This script:
//   1. Patches @electron/packager/dist/unzip.js to use the system `unzip`
//      command instead of extract-zip/yauzl.
//   2. Ensures the electron binary is properly installed by using `unzip`
//      if path.txt or dist/version are missing.
//
// Run automatically via the "postinstall" npm hook.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');

// --------------------------------------------------------------------------
// 1. Patch @electron/packager/dist/unzip.js
// --------------------------------------------------------------------------

const packagerUnzipPath = path.join(root, 'node_modules', '@electron', 'packager', 'dist', 'unzip.js');

const patchedUnzip = `"use strict";
// Patched by scripts/patch-electron-build.js to use system unzip instead of
// extract-zip/yauzl, which hangs on Node.js v24 for certain zip entries.
const { execSync } = require('child_process');
async function extractElectronZip (zipPath, targetDir) {
  execSync('unzip -q ' + JSON.stringify(zipPath) + ' -d ' + JSON.stringify(targetDir), { stdio: 'pipe' });
}
exports.extractElectronZip = extractElectronZip;
`;

if (fs.existsSync(packagerUnzipPath)) {
  const current = fs.readFileSync(packagerUnzipPath, 'utf8');
  if (!current.includes('Patched by scripts/patch-electron-build.js')) {
    fs.writeFileSync(packagerUnzipPath, patchedUnzip);
    console.log('Patched @electron/packager/dist/unzip.js (yauzl/Node 24 workaround)');
  }
} else {
  console.warn('WARNING: @electron/packager/dist/unzip.js not found — skipping patch');
}

// --------------------------------------------------------------------------
// 2. Ensure electron binary is properly installed
// --------------------------------------------------------------------------

const electronDir = path.join(root, 'node_modules', 'electron');
const pathTxt = path.join(electronDir, 'path.txt');
const distVersion = path.join(electronDir, 'dist', 'version');

function electronNeedsInstall () {
  return !fs.existsSync(pathTxt) || !fs.existsSync(distVersion);
}

if (!electronNeedsInstall()) {
  process.exit(0);
}

const { version } = require(path.join(electronDir, 'package.json'));
const { downloadArtifact } = require(path.join(root, 'node_modules', '@electron', 'get'));
const checksums = require(path.join(electronDir, 'checksums.json'));

console.log(`Installing electron v${version} (yauzl/Node 24 workaround) ...`);

downloadArtifact({
  version,
  artifactName: 'electron',
  checksums,
  platform: 'darwin',
  arch: process.arch
}).then(zipPath => {
  const distPath = path.join(electronDir, 'dist');
  fs.rmSync(distPath, { recursive: true, force: true });
  fs.mkdirSync(distPath, { recursive: true });
  execSync('unzip -q ' + JSON.stringify(zipPath) + ' -d ' + JSON.stringify(distPath), { stdio: 'pipe' });
  fs.writeFileSync(pathTxt, 'Electron.app/Contents/MacOS/Electron');
  console.log('Electron binary installed successfully.');
}).catch(err => {
  console.error('Failed to install electron binary:', err.message);
  process.exit(1);
});
