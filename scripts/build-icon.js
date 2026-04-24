'use strict';

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { chromium } = require('playwright');

const repoRoot = path.join(__dirname, '..');
const svgUrl = pathToFileURL(path.join(repoRoot, 'assets', 'icon.svg')).href;
const pngPath = path.join(repoRoot, 'assets', 'icon.png');
const icnsPath = path.join(repoRoot, 'assets', 'icon.icns');

buildIcon().catch(error => {
  console.error(error.message);
  process.exit(1);
});

async function buildIcon () {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 512, height: 512 },
      deviceScaleFactor: 2
    });

    await page.goto(svgUrl);
    await page.screenshot({ path: pngPath, omitBackground: true });
  } finally {
    await browser.close();
  }

  if (process.platform === 'darwin') {
    buildIcns();
  }
}

function buildIcns () {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unicode-search-iconset-'));
  const iconsetDir = path.join(tempDir, 'icon.iconset');

  fs.mkdirSync(iconsetDir);

  try {
    for (const { filename, size } of iconsetFiles()) {
      execFileSync('sips', [
        '-z',
        String(size),
        String(size),
        pngPath,
        '--out',
        path.join(iconsetDir, filename)
      ], { stdio: 'pipe' });
    }

    execFileSync('iconutil', [
      '-c',
      'icns',
      iconsetDir,
      '-o',
      icnsPath
    ], { stdio: 'pipe' });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function iconsetFiles () {
  return [
    { filename: 'icon_16x16.png', size: 16 },
    { filename: 'icon_16x16@2x.png', size: 32 },
    { filename: 'icon_32x32.png', size: 32 },
    { filename: 'icon_32x32@2x.png', size: 64 },
    { filename: 'icon_128x128.png', size: 128 },
    { filename: 'icon_128x128@2x.png', size: 256 },
    { filename: 'icon_256x256.png', size: 256 },
    { filename: 'icon_256x256@2x.png', size: 512 },
    { filename: 'icon_512x512.png', size: 512 },
    { filename: 'icon_512x512@2x.png', size: 1024 }
  ];
}
