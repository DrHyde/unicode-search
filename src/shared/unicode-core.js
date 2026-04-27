'use strict';

const { TextDecoder, TextEncoder } = require('node:util');

function createUnicodeTools (unicodeDataTxt) {
  const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
  const utf8Encoder = new TextEncoder();
  const unicodeEntries = [];
  const namesByCodePoint = new Map();
  const combiningClassesByCodePoint = new Map();

  for (const line of unicodeDataTxt.trim().split('\n')) {
    const [hexCodePoint, name, , canonicalCombiningClass] = line.split(';');
    const codePoint = Number.parseInt(hexCodePoint, 16);

    unicodeEntries.push({ codePoint, name });
    namesByCodePoint.set(codePoint, name);
    combiningClassesByCodePoint.set(codePoint, Number.parseInt(canonicalCombiningClass, 10));
  }

  function parseInput (userInput) {
    const normalizedInput = userInput.trim();

    if (normalizedInput.length === 0) {
      return [];
    }

    const characters = Array.from(normalizedInput);
    if (characters.length === 1) {
      return [characters[0].codePointAt(0)];
    }

    if (/^\d+$/.test(normalizedInput)) {
      return [Number.parseInt(normalizedInput, 10)];
    }

    if (/^0x[a-f\d]+$/i.test(normalizedInput)) {
      return [Number.parseInt(normalizedInput.slice(2), 16)];
    }

    const numberRange = /^(\d+|0x[a-f\d]+) *- *(\d+|0x[a-f\d]+)$/i;
    const rangeMatch = normalizedInput.match(numberRange);
    if (rangeMatch) {
      return range(parseCodePoint(rangeMatch[1]), parseCodePoint(rangeMatch[2]));
    }

    if (normalizedInput.includes(',')) {
      return normalizedInput
        .split(',')
        .map(part => part.trim())
        .filter(part => part.length > 0)
        .flatMap(parseInput);
    }

    if (normalizedInput.length >= 4) {
      const nameMatches = findCodePointsByName(normalizedInput);
      if (nameMatches.length > 0) {
        return nameMatches;
      }
    }

    return decodeMojibake(normalizedInput);
  }

  function parseCodePoint (value) {
    if (value.toLowerCase().startsWith('0x')) {
      return Number.parseInt(value.slice(2), 16);
    }

    return Number.parseInt(value, 10);
  }

  function range (start, stop) {
    const result = [];

    for (let value = start; value <= stop; value++) {
      result.push(value);
    }

    return result;
  }

  function findCodePointsByName (needle) {
    const upperNeedle = needle.toUpperCase();

    return unicodeEntries
      .filter(entry => entry.name.includes(upperNeedle))
      .map(entry => entry.codePoint);
  }

  function decodeMojibake (userInput) {
    const bytes = [];
    for (let index = 0; index < userInput.length; index++) {
      bytes.push(userInput.charCodeAt(index) & 0xff);
    }

    try {
      const decoded = utf8Decoder.decode(Uint8Array.from(bytes));
      return Array.from(decoded, character => character.codePointAt(0));
    } catch (error) {
      if (error instanceof TypeError) {
        return [];
      }

      throw error;
    }
  }

  function charToName (codePoint) {
    return namesByCodePoint.get(codePoint) || null;
  }

  function charToUtf8Bytes (codePoint) {
    return Array.from(utf8Encoder.encode(String.fromCodePoint(codePoint)));
  }

  function getCharacterInfo (codePoint) {
    const name = charToName(codePoint);
    const glyph = String.fromCodePoint(codePoint);
    const combiningClass = combiningClassesByCodePoint.get(codePoint) || 0;

    return {
      codePoint,
      hexCodePoint: `0x${codePoint.toString(16)}`,
      glyph,
      displayGlyph: name && name.startsWith('COMBINING')
        ? String.fromCodePoint(0x25CC) + glyph
        : glyph,
      combiningClass,
      name,
      utf8Bytes: charToUtf8Bytes(codePoint)
    };
  }

  function search (userInput) {
    return parseInput(userInput).map(getCharacterInfo);
  }

  return {
    charToName,
    charToUtf8Bytes,
    getCharacterInfo,
    parseInput,
    search
  };
}

module.exports = {
  createUnicodeTools
};
