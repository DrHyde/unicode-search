#!/usr/bin/env node
'use strict';

const { parseArgs } = require('node:util');

const options = {
  glyph: {
    type: 'boolean',
    short: 'g'
  },
  codepoint: {
    type: 'boolean',
    short: 'c'
  },
  utf8: {
    type: 'boolean',
    short: 'u'
  },
  name: {
    type: 'boolean',
    short: 'n'
  },
  help: {
    type: 'boolean',
    short: 'h'
  },
  version: {
    type: 'boolean',
    short: 'v'
  }
};

function main ({
  argv,
  version,
  unicodeTools,
  stdout = process.stdout,
  stderr = process.stderr
}) {
  let parsedArgs;

  try {
    parsedArgs = parseArgs({
      args: argv,
      options,
      allowPositionals: true
    });
  } catch (error) {
    if (error instanceof TypeError) {
      writeLine(stderr, `Error: ${error.message}`);
      writeLine(stderr, help());
      return 1;
    }

    throw error;
  }

  const { values, positionals } = parsedArgs;

  if (values.help) {
    writeLine(stdout, help());
    return 0;
  }

  if (values.version) {
    writeLine(stdout, version);
    return 0;
  }

  if (positionals.length === 0) {
    writeLine(stderr, 'Error: No input given.');
    writeLine(stderr, help());
    return 1;
  }

  const enabled = {
    glyph: values.glyph ? 1 : 0,
    codepoint: values.codepoint ? 1 : 0,
    utf8: values.utf8 ? 1 : 0,
    name: values.name ? 1 : 0
  };

  if (enabled.glyph + enabled.codepoint + enabled.utf8 + enabled.name === 0) {
    enabled.glyph = 1;
    enabled.codepoint = 1;
    enabled.utf8 = 1;
    enabled.name = 1;
  }

  renderCharsForCli(
    unicodeTools.parseInput(positionals.join(',')),
    unicodeTools,
    enabled,
    stdout
  );

  return 0;
}

function renderCharsForCli (chars, unicodeTools, enabled, stdout) {
  for (let index = 0; index < chars.length; index++) {
    const char = chars[index];
    const name = unicodeTools.charToName(char);

    if (enabled.glyph === 1) {
      writeLine(
        stdout,
        `${emitLeader('    glyph', enabled)}${
          (name && name.startsWith('COMBINING') ? String.fromCodePoint(0x25CC) : '') +
            String.fromCodePoint(char)
        }`
      );
    }

    if (enabled.codepoint === 1) {
      writeLine(stdout, `${emitLeader('codepoint', enabled)}${char} (0x${char.toString(16)})`);
    }

    if (enabled.utf8 === 1) {
      writeLine(
        stdout,
        `${emitLeader('    UTF-8', enabled)}${
          unicodeTools.charToUtf8Bytes(char)
            .map(byte => '0x' + byte.toString(16).padStart(2, '0'))
            .join(' ')
        }`
      );
    }

    if (enabled.name === 1) {
      writeLine(stdout, `${emitLeader('     name', enabled)}${name}`);
    }

    if (enabled.glyph + enabled.codepoint + enabled.utf8 + enabled.name > 1 && index < chars.length - 1) {
      writeLine(stdout);
    }
  }
}

function emitLeader (text, enabled) {
  if (enabled.glyph + enabled.codepoint + enabled.utf8 + enabled.name > 1) {
    return text + ': ';
  }

  return '';
}

function writeLine (stream, text = '') {
  stream.write(text + '\n');
}

function help () {
  return `
Usage: unicode-search [options] <characters>

Options:

  -g show the character's glyph
  -c show the character's codepoint
  -u show the character's UTF-8 encoding
  -n show the character's name
  -v, --version show the version number

  -- treat the rest of the arguments as <characters> even if they start with a hyphen

In the absence of any options the default is to show them all for each character.
If more than one is to be shown, then each will be introduced by its name:

  $ unicode-search -u p q          # no introductions required
  0x70
  0x71

  $ unicode-search -n -u th ð þ    # more than one option, so ...
    UTF-8: 0x74
     name: LATIN SMALL LETTER T

    UTF-8: 0x68
     name: LATIN SMALL LETTER H

    UTF-8: 0xc3 0xb0
     name: LATIN SMALL LETTER ETH

    UTF-8: 0xc3 0xbe
     name: LATIN SMALL LETTER THORN

Each of <characters> can be:

  * a single character, eg 'A'
  * a decimal codepoint, eg '65'
  * a hexadecimal codepoint, eg '0x41'
  * a range of codepoints, eg '65-0x5a'
  * the (partial, at least 4 characters) name of a character, eg 'combining caron'
  * ASCII text (if it doesn't match a character name), eg 'hello'
  * Mojibake! (assumed to be a bunch of single byte characters that ought to
      be UTF-8 encoded), eg Ð¸
`;
}

module.exports = {
  help,
  main
};

if (require.main === module) {
  process.exitCode = main({
    argv: process.argv.slice(2),
    version: require('../../package.json').version,
    unicodeTools: require('../shared/unicode')
  });
}
