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

module.exports = {
  parseLine
};