let optGlyph = 0;
let optCodepoint = 0;
let optUTF8 = 0;
let optName = 0;

process.argv.shift(); // node
process.argv.shift(); // script

while (process.argv[0] !== undefined && process.argv[0] !== '--' && process.argv[0].startsWith('-')) {
  const arg = process.argv.shift();

  switch (arg) {
    case '-g':
      optGlyph = 1;
      break;

    case '-c':
      optCodepoint = 1;
      break;

    case '-u':
      optUTF8 = 1;
      break;

    case '-n':
      optName = 1;
      break;

    case '-h': case '--help':
      console.log(help());
      process.exit(0);

    default:
      console.error(`Error: Unknown option ${arg}`);
      console.error(help());
      process.exit(1);
  }
}

if (process.argv[0] === '--') {
  process.argv.shift();
}

if (process.argv.length === 0) {
  console.error('Error: No input given.');
  console.error(help());
  process.exit(1);
}

// turn them all on if the user didn't ask for any
if (optGlyph + optCodepoint + optUTF8 + optName === 0) {
  optGlyph = 1;
  optCodepoint = 1;
  optUTF8 = 1;
  optName = 1;
}

renderCharsForCLI(parseOneInput(process.argv.join(',')));

function emitLeader (text) {
  if (optGlyph + optCodepoint + optUTF8 + optName > 1) {
    return text + ': ';
  }
  return '';
}

function renderCharsForCLI (chars) {
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const name = charToName(char);

    if (optGlyph === 1) {
      console.log(`${emitLeader('    glyph')}${
        (name && name.startsWith('COMBINING') ? String.fromCodePoint(0x25CC) : '') +
          String.fromCodePoint(char)
      }`);
    }

    if (optCodepoint === 1) {
      console.log(`${emitLeader('codepoint')}${char} (0x${char.toString(16)})`);
    }

    if (optUTF8 === 1) {
      console.log(`${emitLeader('    UTF-8')}${
        charToUTF8bytes(char)
          .map(b => '0x' + b.toString(16).padStart(2, '0'))
          .join(' ')
      }`);
    }

    if (optName === 1) {
      console.log(`${emitLeader('     name')}${charToName(char)}`);
    }

    if (optGlyph + optCodepoint + optUTF8 + optName > 1 && i < chars.length - 1) { console.log(''); }
  }
}

function help () {
  return `
Usage: unicode-search [options] <characters>

Options:

  -g show the character's glyph
  -c show the character's codepoint
  -u show the character's UTF-8 encoding
  -n show the character's name

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
