'use strict';

function constructLine(data) {
  data = data || {};
  let lineObject = null;
  const tmp = data.phrase.trim().toLowerCase();
  if (tmp) {
    if (data.id) {
      lineObject = {
        phraseToStore: `${data.id}:${data.phrase}`,
        text: tmp
      };
    }
  }
  return lineObject;
}

function findWordCandidates(termToSearch, entries = [], count = 10) {
  const results = [];

  // We use find in order to be able to break when we return true
  entries.find((entry) => {
    // Get the minimum length between the term and the possible results
    // and if the substrings are different we have to break the iteration
    // and return the result. It means that we've moved into another range
    // of results that they are completely different.
    const minLen = Math.min(entry.length, termToSearch.length);

    if (entry.slice(0, minLen) !== termToSearch.slice(0, minLen)) {
      return true;
    } else if (results.length >= count) {
      return true;
    }

    const lastChar = entry.substr(entry.length - 1);
    if (lastChar === '*') {
      const entryWithoutStar = entry.slice(0, -1);

      results.push(entryWithoutStar);
    }
  });

  return results;
}

// Filter out the score. We will never use it.
function filterOutTheScore(docs = []) {
  return docs.filter(item => {
    return item !== '0';
  });
}

function generateDocNames(zkey_docs_prefix, completions = []) {
  zkey_docs_prefix = zkey_docs_prefix || '';

  return completions.map(key => {
    return zkey_docs_prefix + key;
  });
}

module.exports = {
  constructLine,
  findWordCandidates,
  filterOutTheScore,
  generateDocNames
};
