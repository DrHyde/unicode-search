// get rid of the first two elements, ie `node` and `unicode-search`
process.argv.shift();
process.argv.shift();

renderCharsForCLI(parseOneInput(process.argv.join(',')));

function renderCharsForCLI (chars) {
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i];
    const name = charToName(char);
    console.log(`    glyph: ${
      (name && name.startsWith('COMBINING') ? String.fromCodePoint(0x25CC) : '') +
        String.fromCodePoint(char)
    }`);
    console.log(`codepoint: ${char} (0x${char.toString(16)})`);
    console.log(`    UTF-8: ${
      charToUTF8bytes(char)
        .map(b => '0x' + b.toString(16).padStart(2, '0'))
        .join(' ')
    }`);
    console.log(`     name: ${charToName(char)}`);
    if(i < chars.length - 1) { console.log(''); }
  }
}
