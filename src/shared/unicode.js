'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createUnicodeTools } = require('./unicode-core');

const unicodeDataPath = path.join(__dirname, '..', '..', 'data', 'UnicodeData.txt');
module.exports = createUnicodeTools(fs.readFileSync(unicodeDataPath, 'utf8'));
