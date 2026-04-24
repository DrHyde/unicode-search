'use strict';

const fs = require('node:fs');
const path = require('node:path');

const repoRoot = path.join(__dirname, '..');
const outputPath = path.join(repoRoot, 'out', 'unicode-search');

const unicodeCoreSource = readSource('src/shared/unicode-core.js');
const runCliSource = readSource('src/cli/run-cli.js');
const unicodeData = fs.readFileSync(path.join(repoRoot, 'data', 'UnicodeData.txt'), 'utf8');
const packageVersion = require(path.join(repoRoot, 'package.json')).version;

const bundle = `#!/usr/bin/env node
'use strict';

const __modules = {
  'src/shared/unicode-core.js': function (module, exports, require) {
${indent(unicodeCoreSource, 4)}
  },
  'src/cli/run-cli.js': function (module, exports, require) {
${indent(runCliSource, 4)}
  },
  'virtual:unicode-data': function (module) {
    module.exports = ${JSON.stringify(unicodeData)};
  }
};

const __cache = new Map();

function __require (id) {
  if (!Object.hasOwn(__modules, id)) {
    return require(id);
  }

  if (__cache.has(id)) {
    return __cache.get(id).exports;
  }

  const module = { exports: {} };
  __cache.set(id, module);
  __modules[id](module, module.exports, __require);
  return module.exports;
}

const { createUnicodeTools } = __require('src/shared/unicode-core.js');
const { main } = __require('src/cli/run-cli.js');

process.exitCode = main({
  argv: process.argv.slice(2),
  version: ${JSON.stringify(packageVersion)},
  unicodeTools: createUnicodeTools(__require('virtual:unicode-data'))
});
`;

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, bundle);
fs.chmodSync(outputPath, 0o755);

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
