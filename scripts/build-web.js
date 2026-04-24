'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const outputPath = path.join(repoRoot, 'out', 'unicode-search.html');
const unicodeCoreSource = readSource('src/shared/unicode-core.js');
const rendererSource = readSource('renderer.js');
const unicodeData = fs.readFileSync(path.join(repoRoot, 'data', 'UnicodeData.txt'), 'utf8');
const iconSvg = fs.readFileSync(path.join(repoRoot, 'assets', 'icon.svg'), 'utf8').trim();
const indexHtml = fs.readFileSync(path.join(repoRoot, 'index.html'), 'utf8');
const faviconHref = 'data:image/svg+xml,' + encodeURIComponent(iconSvg);

const standaloneScript = `
    <script>
      'use strict';

      const module = { exports: {} };
      const exports = module.exports;
      const require = (id) => {
        if (id === 'node:util') {
          return {
            TextDecoder: window.TextDecoder,
            TextEncoder: window.TextEncoder
          };
        }

        throw new Error('Unsupported module: ' + id);
      };

${indent(unicodeCoreSource, 6)}

      const unicodeToolsFactory = module.exports.createUnicodeTools;
      window.unicodeSearch = unicodeToolsFactory(${JSON.stringify(unicodeData)});
    </script>
    <script>
${indent(rendererSource, 6)}
    </script>`;

const standaloneHtml = indexHtml
  .replace(
    /<meta\s+http-equiv="Content-Security-Policy"[\s\S]*?>\s*/m,
    ''
  )
  .replace(
    /<link rel="icon" href="\.\/assets\/icon\.svg" type="image\/svg\+xml">/,
    `<link rel="icon" href="${faviconHref}" type="image/svg+xml">`
  )
  .replace(
    /<script src="\.\/renderer\.js" defer><\/script>/,
    standaloneScript
  );

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, standaloneHtml);

function readSource (relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
    .replace(/^#!.*\n/, '')
    .trimEnd();
}

function indent (text, spaces) {
  const prefix = ' '.repeat(spaces);
  return text
    .split('\n')
    .map(line => prefix + line)
    .join('\n');
}
