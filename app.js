const numberRange = /^(\d+|0x[a-f\d]+) *- *(\d+|0x[a-f\d]+)$/;
const csv = /^([^,]+,)+[^,]+(, *)?$/;

function parseOneInput (userInput) {
  if (userInput.length === 0) {
    return [];
  } else if (userInput.length === 1) {
    return [getSingleCharFromSingleChar(userInput)];
  } else if (/^\d+$/.test(userInput)) {
    return [getSingleCharFromInt(userInput)];
  } else if (/^0x[a-f\d]+$/.test(userInput.toLowerCase())) {
    return [getSingleCharFromInt(userInput)];
  } else if (numberRange.test(userInput.toLowerCase())) {
    const matches = numberRange.exec(userInput.toLowerCase());
    return range(parseInt(matches[1]), parseInt(matches[2]));
  } else if (csv.test(userInput)) {
    const matches = userInput.replace(/, *$/, '').split(',');
    let userInputs = [];
    for (let i = 0; i < matches.length; i++) {
      matches[i] = matches[i].trim();
      userInputs = userInputs.concat(parseOneInput(matches[i]));
    }
    return userInputs;
  // } elsif( userInput contains combining characters ) {
  // ...
  } else if (userInput.length >= 4) {
    const results = [];
    unicodeDataTxt.split('\n').forEach((line) => {
      const fields = line.split(';');
      if (fields[1] && fields[1].includes(userInput.toUpperCase())) {
        results.push(parseInt(fields[0], 16));
      }
    });
    return results;
  }
}

function range (start, stop) {
  const result = [];
  for (let i = start; i <= stop; i++) {
    result.push(i);
  }
  return result;
}

function getSingleCharFromSingleChar (userInput) { return userInput.charCodeAt(0); }

function getSingleCharFromInt (userInput) { return parseInt(userInput); }

const charnamesByHex = new Map();
function charToName (char) {
  const hexChar = char.toString(16).padStart(4, '0').toUpperCase();
  if (!charnamesByHex.has(hexChar)) {
    charnamesByHex.set(hexChar, false);
    unicodeDataTxt.split('\n').forEach((line) => {
      const fields = line.split(';');
      if (fields[0] === hexChar) { //  && fields[1] != '<control>') {
        charnamesByHex.set(hexChar, fields[1]);
      }
    });
  }
  return charnamesByHex.get(hexChar);
}

function charToUTF8bytes (char) {
  const utf8bytes = [];
  if (char < 0x80) {
    utf8bytes.push(char);
  } else if (char < 0x800) {
    utf8bytes.push(0xc0 | (char >> 6));
    utf8bytes.push(0x80 | (char & 0x3f));
  } else if (char < 0x10000) {
    utf8bytes.push(0xe0 | (char >> 12));
    utf8bytes.push(0x80 | ((char >> 6) & 0x3f));
    utf8bytes.push(0x80 | (char & 0x3f));
  } else if (char < 0x200000) {
    utf8bytes.push(0xf0 | (char >> 18));
    utf8bytes.push(0x80 | ((char >> 12) & 0x3f));
    utf8bytes.push(0x80 | ((char >> 6) & 0x3f));
    utf8bytes.push(0x80 | (char & 0x3f));
  }
  return utf8bytes;
}
