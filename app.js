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
  } else {
    const results = [];
    if (userInput.length >= 4) {
      unicodeDataTxt.split('\n').forEach((line) => {
        const fields = line.split(';');
        if (fields[1] && fields[1].includes(userInput.toUpperCase())) {
          results.push(parseInt(fields[0], 16));
        }
      });
    }
    if (results.length === 0) {
      // We got nothing, so try decoding Mojibake. We'll assume that it is
      // UTF-8 bytes represented as ISO-Latin-1
      const bytes = [];
      for (let i = 0; i < userInput.length; i++) {
        // JS chars are UTF-16, so ignore the top 8 bits
        bytes.push(userInput.charCodeAt(i) & 0xff);
      }
      while (bytes.length > 0) {
        const utf8bytes = [];
        if (bytes[0] < 0x80) {
          // single byte character
          utf8bytes.push(bytes.shift());
        } else if (bytes[0] < 0xc0) {
          // Invalid UTF-8
          break;
        } else if (bytes[0] < 0xe0) {
          utf8bytes.push(bytes.shift());
          utf8bytes.push(bytes.shift());
        } else if (bytes[0] < 0xf0) {
          utf8bytes.push(bytes.shift());
          utf8bytes.push(bytes.shift());
          utf8bytes.push(bytes.shift());
        } else if (bytes[0] < 0xf8) {
          utf8bytes.push(bytes.shift());
          utf8bytes.push(bytes.shift());
          utf8bytes.push(bytes.shift());
          utf8bytes.push(bytes.shift());
        } else {
          // Invalid UTF-8
          break;
        }
        // At this point utf8bytes contains the bytes for a single character

        // lightly adapted from https://weblog.rogueamoeba.com/2017/02/27/javascript-correctly-converting-a-byte-array-to-a-utf-8-string/
        const extraByteMap = [1, 1, 1, 1, 2, 2, 3, 0];
        const count = utf8bytes.length;
        let char = 0;
        for (let index = 0; index < count;) {
          char = utf8bytes[index++];
          if (char & 0x80) {
            let extra = extraByteMap[(char >> 3) & 0x07];
            if (!(char & 0x40) || !extra || ((index + extra) > count)) { return null; }

            char = char & (0x3F >> extra);
            for (;extra > 0; extra -= 1) {
              const charx = utf8bytes[index++];
              if ((charx & 0xC0) !== 0x80) { return null; }

              char = (char << 6) | (charx & 0x3F);
            }
          }
        }

        if (char > 0) {
          results.push(char);
        }
      }
    }
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
