'use strict';

function parseLine (line) {
  const chunks = line.replace(/['"]+/g, '').split(',');
  const id = chunks[0];
  const phrase = chunks[1];

  return {
    id,
    phrase
  }
}

function findWordCandidates(termToSearch, entries, count, findExact = null) {
  const results = [];

  entries.forEach((entry) => {
    const minLen = Math.min(entry.length, termToSearch.length);

    if (entry.slice(0, minLen) !== termToSearch.slice(0, minLen)) {
      return results;
    }

    if (entry[entry.length - 1] === '*') {
      const entryWithoutStar = entry.slice(0, -1);

      results.push(entryWithoutStar);

      if (findExact) {
        return results;
      }
    } else if (results.length >= count) {
      return results;
    }
  });

  return results;
}

// Filter out the score. We will never use it.
function filterOutTheScore(docs) {
  return docs.filter(item => {
    return item !== '0';
  });

}

module.exports = {
  parseLine,
  findWordCandidates,
  filterOutTheScore
};