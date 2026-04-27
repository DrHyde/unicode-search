'use strict';

const { execFileSync } = require('node:child_process');
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { _electron: electron, chromium, firefox, webkit } = require('playwright');

const {
  charToName,
  charToUtf8Bytes,
  parseInput,
  search
} = require('../src/shared/unicode');
const repoRoot = path.join(__dirname, '..');
const packageVersion = require('../package.json').version;

test('parseInput accepts decimal and hexadecimal code points', () => {
  assert.deepEqual(parseInput('65'), [65]);
  assert.deepEqual(parseInput('0x41'), [65]);
});

test('parseInput expands ranges and comma-separated input', () => {
  assert.deepEqual(parseInput('65-67'), [65, 66, 67]);
  assert.deepEqual(parseInput('65, 0x42, C'), [65, 66, 67]);
});

test('parseInput finds characters by Unicode name', () => {
  assert.ok(parseInput('multiocular').includes(0xa66e));
});

test('parseInput decodes mojibake as UTF-8 masquerading as Latin-1', () => {
  assert.deepEqual(parseInput('Ð¸'), [0x438]);
});

test('shared helpers expose names and UTF-8 bytes', () => {
  assert.equal(charToName(65), 'LATIN CAPITAL LETTER A');
  assert.deepEqual(charToUtf8Bytes(0x438), [0xd0, 0xb8]);
});

test('search returns renderer-friendly character info', () => {
  assert.deepEqual(search('A')[0], {
    codePoint: 65,
    hexCodePoint: '0x41',
    glyph: 'A',
    displayGlyph: 'A',
    combiningClass: 0,
    name: 'LATIN CAPITAL LETTER A',
    utf8Bytes: [0x41]
  });
});

test('search prepends dotted circle to combining marks', () => {
  assert.equal(search('\u0301')[0].displayGlyph, '\u25cc\u0301');
  assert.equal(search('\u0327')[0].combiningClass, 202);
});

test('build:cli emits a standalone CLI artifact', () => {
  execFileSync(process.execPath, ['scripts/build-cli.js'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'unicode-search-cli-'));
  const bundledCliPath = path.join(tempDir, 'unicode-search');

  fs.copyFileSync(path.join(repoRoot, 'out', 'unicode-search'), bundledCliPath);
  fs.chmodSync(bundledCliPath, 0o755);

  const output = execFileSync(process.execPath, [bundledCliPath, '-n', 'A'], {
    cwd: tempDir,
    encoding: 'utf8'
  });

  assert.equal(output, 'LATIN CAPITAL LETTER A\n');

  const versionOutput = execFileSync(process.execPath, [bundledCliPath, '--version'], {
    cwd: tempDir,
    encoding: 'utf8'
  });

  assert.equal(versionOutput, `${packageVersion}\n`);
});

test('build:web emits a standalone HTML artifact', () => {
  execFileSync(process.execPath, ['scripts/build-web.js'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  const html = fs.readFileSync(path.join(repoRoot, 'out', 'unicode-search.html'), 'utf8');

  assert.match(html, /window\.unicodeSearch = unicodeToolsFactory\(/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
  assert.match(html, /window\.addEventListener\('DOMContentLoaded'/);
  assert.doesNotMatch(html, /href="\.\/assets\/icon\.svg"/);
  assert.doesNotMatch(html, /<script src="\.\/renderer\.js" defer><\/script>/);
});

test('build:icon emits app icon assets', () => {
  execFileSync(process.execPath, ['scripts/build-icon.js'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  assert.ok(fs.statSync(path.join(repoRoot, 'assets', 'icon.png')).size > 0);

  if (process.platform === 'darwin') {
    assert.ok(fs.statSync(path.join(repoRoot, 'assets', 'icon.icns')).size > 0);
  }
});

test('standalone web page renders result cards in Chromium', async () => {
  await assertStandalonePageRenders(chromium);
});

test('standalone web page renders result cards in Firefox', async () => {
  await assertStandalonePageRenders(firefox);
});

test('standalone web page renders result cards in WebKit', async () => {
  await assertStandalonePageRenders(webkit);
});

test('electron app renders result cards', async () => {
  const app = await electron.launch({
    args: ['.'],
    cwd: repoRoot
  });

  try {
    const window = await app.firstWindow();
    await window.waitForFunction(() => document.querySelectorAll('.result-card').length > 0);

    const rendered = await window.evaluate(() => ({
      cards: document.querySelectorAll('.result-card').length,
      glyph: document.querySelector('.result-glyph')?.textContent || null,
      bodyText: document.body.innerText
    }));

    assert.ok(rendered.cards > 0);
    assert.equal(rendered.glyph, '9');
    assert.match(rendered.bodyText, /DIGIT NINE/);
    assert.match(rendered.bodyText, /LATIN SMALL LETTER A/);
  } finally {
    await app.close();
  }
});

test('electron app only applies the combining-mark glyph font override to combining marks', async () => {
  const app = await electron.launch({
    args: ['.'],
    cwd: repoRoot
  });

  try {
    const window = await app.firstWindow();
    await window.fill('#inputbox', '\u0301');
    await window.waitForFunction(() => document.querySelectorAll('.result-card').length > 0);

    const combiningGlyph = await window.evaluate(() => {
      const glyph = document.querySelector('.result-glyph');
      const preview = glyph?.querySelector('.combining-mark-preview');
      return {
        text: glyph?.textContent || null,
        className: glyph?.className || null,
        fontFamily: glyph ? window.getComputedStyle(glyph).fontFamily : null,
        previewClassName: preview?.className || null
      };
    });

    assert.equal(combiningGlyph.text, '\u25cc\u0301');
    assert.match(combiningGlyph.className, /\bcombining-mark\b/);
    assert.equal(combiningGlyph.fontFamily, 'sans-serif');
    assert.equal(
      combiningGlyph.previewClassName,
      'combining-mark-preview mark-above mark-center'
    );

    await window.fill('#inputbox', '\u0323');
    await window.waitForFunction(() => document.querySelector('.result-glyph')?.textContent === '\u25cc\u0323');

    const belowMarkGlyph = await window.evaluate(() =>
      document.querySelector('.combining-mark-preview')?.className || null
    );

    assert.equal(belowMarkGlyph, 'combining-mark-preview mark-below mark-center');

    await window.fill('#inputbox', '\u0327');
    await window.waitForFunction(() => document.querySelector('.result-glyph')?.textContent === '\u25cc\u0327');

    const cedillaGlyph = await window.evaluate(() =>
      document.querySelector('.combining-mark-preview')?.className || null
    );

    assert.equal(cedillaGlyph, 'combining-mark-preview mark-below mark-center');

    await window.fill('#inputbox', 'ꙮ,𓀈,β,ð');
    await window.waitForFunction(() => document.querySelectorAll('.result-card').length === 4);

    const regularGlyphs = await window.evaluate(() => Array.from(document.querySelectorAll('.result-glyph')).map((glyph) => ({
      text: glyph.textContent,
      className: glyph.className
    })));

    assert.deepEqual(
      regularGlyphs.map(({ text }) => text),
      ['ꙮ', '𓀈', 'β', 'ð']
    );
    assert.ok(regularGlyphs.every(({ className }) => className === 'result-glyph'));
  } finally {
    await app.close();
  }
});

async function assertStandalonePageRenders (browserType) {
  execFileSync(process.execPath, ['scripts/build-web.js'], {
    cwd: repoRoot,
    stdio: 'inherit'
  });

  const browser = await browserType.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto('file://' + path.resolve(repoRoot, 'out', 'unicode-search.html'));

    await page.waitForFunction(() => document.querySelectorAll('.result-card').length > 0);

    const rendered = await page.evaluate(() => ({
      cards: document.querySelectorAll('.result-card').length,
      glyph: document.querySelector('.result-glyph')?.textContent || null,
      bodyText: document.body.innerText
    }));

    assert.ok(rendered.cards > 0);
    assert.equal(rendered.glyph, '9');
    assert.match(rendered.bodyText, /DIGIT NINE/);
    assert.match(rendered.bodyText, /LATIN SMALL LETTER A/);
  } finally {
    await browser.close();
  }
}
