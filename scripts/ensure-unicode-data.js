'use strict';

const fs = require('node:fs');
const path = require('node:path');

const unicodeDataPath = path.join(__dirname, '..', 'data', 'UnicodeData.txt');
const unicodeDataUrl = 'https://unicode.org/Public/UNIDATA/UnicodeData.txt';

ensureUnicodeData().catch(error => {
  console.error(error.message);
  process.exit(1);
});

async function ensureUnicodeData () {
  fs.mkdirSync(path.dirname(unicodeDataPath), { recursive: true });

  const headers = {};
  if (fs.existsSync(unicodeDataPath)) {
    headers['If-Modified-Since'] = fs.statSync(unicodeDataPath).mtime.toUTCString();
  }

  const response = await fetch(unicodeDataUrl, { headers });
  if (response.status === 304) {
    return;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch UnicodeData.txt: ${response.status} ${response.statusText}`);
  }

  fs.writeFileSync(unicodeDataPath, await response.text());

  const lastModified = response.headers.get('last-modified');
  if (lastModified) {
    const modifiedAt = new Date(lastModified);
    if (!Number.isNaN(modifiedAt.valueOf())) {
      fs.utimesSync(unicodeDataPath, modifiedAt, modifiedAt);
    }
  }
}
