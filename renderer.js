'use strict';

window.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('inputbox');
  const results = document.getElementById('results');

  const initialQuery = getInitialQuery();
  if (initialQuery) {
    input.value = initialQuery;
  }

  input.addEventListener('input', () => {
    renderSearchResults(input.value);
  });

  renderSearchResults(input.value);

  function renderSearchResults (userInput) {
    syncQueryToLocation(userInput);

    const matches = window.unicodeSearch.search(userInput);
    if (matches.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.textContent = userInput.length === 0
        ? 'Start typing to search for Unicode characters.'
        : 'No characters matched that search.';
      results.replaceChildren(emptyState);
      return;
    }

    const cards = matches.map(createResultCard);
    results.replaceChildren(...cards);
  }
});

function getInitialQuery () {
  const url = new URL(window.location.href);
  return url.searchParams.get('q');
}

function syncQueryToLocation (userInput) {
  if (window.location.protocol === 'file:') {
    return;
  }

  const url = new URL(window.location.href);

  if (userInput.length > 0) {
    url.searchParams.set('q', userInput);
  } else {
    url.searchParams.delete('q');
  }

  window.history.replaceState({}, '', url);
}

function createResultCard (character) {
  const card = document.createElement('article');
  card.className = 'result-card';

  const glyph = document.createElement('div');
  glyph.className = 'result-glyph';
  glyph.textContent = character.displayGlyph;
  card.append(glyph, createResultTable(character));

  return card;
}

function createResultTable (character) {
  const table = document.createElement('table');
  table.className = 'result-table';
  const body = document.createElement('tbody');

  body.append(
    createRow('Code point', `${character.codePoint} (${character.hexCodePoint})`),
    createRow('UTF-8', character.utf8Bytes.map(formatByte).join(' ')),
    createRow('Name', character.name || 'Unknown')
  );

  table.append(body);
  return table;
}

function createRow (label, value) {
  const row = document.createElement('tr');
  const heading = document.createElement('th');
  const data = document.createElement('td');

  heading.scope = 'row';
  heading.textContent = label;
  data.textContent = value;

  row.append(heading, data);
  return row;
}

function formatByte (byte) {
  return '0x' + byte.toString(16).padStart(2, '0');
}
