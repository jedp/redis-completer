'use strict';

const expect = require('chai').expect;

const helpers = require('../lib/helpers');

const data = require('./data');

describe('helpers', () => {

  describe('parseLine', () => {

    it('should not crash if line does not exits', () => {
      const shop = helpers.parseLine();

      expect(shop).to.be.an('object');
      expect(shop.id).to.be.a('string');
      expect(shop.phrase).to.be.an('undefined');
      expect(shop.id).to.equal('');
    });

    it('should return a shop object', () => {
      const shop = helpers.parseLine('"123","ZARA"');

      expect(shop).to.be.an('object');
      expect(shop.id).to.be.a('string');
      expect(shop.phrase).to.be.a('string');
      expect(shop.id).to.equal('123');
      expect(shop.phrase).to.equal('ZARA');
    });

    it('should return a shop object if more data passed', () => {
      const shop = helpers.parseLine('"123","ZARA","address"');

      expect(shop).to.be.an('object');
      expect(shop.id).to.be.a('string');
      expect(shop.phrase).to.be.a('string');
      expect(shop.id).to.equal('123');
      expect(shop.phrase).to.equal('ZARA');
    });

  });

  describe('findWordCandidates', () => {

    it('should not crash if not term and entries', () => {
      const candidates = helpers.findWordCandidates();

      expect(candidates).to.be.an('array');
      expect(candidates.length).to.equal(0);
    });

    it('should be no candidates if no entries', () => {
      const candidates = helpers.findWordCandidates('norm');

      expect(candidates).to.be.an('array');
      expect(candidates.length).to.equal(0);
    });

    it('should be candidates if entries', () => {
      const candidates = helpers.findWordCandidates('norm', data.goodEntries);

      expect(candidates).to.be.an('array');
      expect(candidates.length).to.equal(2);
      expect(candidates[0]).to.equal('norman');
      expect(candidates[1]).to.equal('normanby');
    });

    it('should be no candidates if entries not matching', () => {
      const candidates = helpers.findWordCandidates('norm', data.badEntries);

      expect(candidates).to.be.an('array');
      expect(candidates.length).to.equal(0);
    });

    it('should return one result if count 1', () => {
      const candidates = helpers.findWordCandidates('norm', data.goodEntries, 1);

      expect(candidates).to.be.an('array');
      expect(candidates.length).to.equal(1);
      expect(candidates[0]).to.equal('norman');
    });

  });

  describe('filterOutTheScore', () => {

    it('should not crash if not term and entries', () => {
      const results = helpers.filterOutTheScore();

      expect(results).to.be.an('array');
      expect(results.length).to.equal(0);
    });

    it('should filter out the zero cores', () => {
      const expectedResult = [
        '1:Norman & sons',
        '2:The norman clothes',
        '3:Best clothes - Norman'
      ];

      const results = helpers.filterOutTheScore(data.docsWithScores);

      expect(results).to.be.an('array');
      expect(results.length).to.equal(3);
      expect(results).to.eql(expectedResult);
    });

  });

  describe('generateDocNames', () => {
    it('should not crash if not zkey_docs_prefix and completions', () => {
      const results = helpers.generateDocNames();

      expect(results).to.be.an('array');
      expect(results.length).to.equal(0);
    });

    it('should return empty array if no completions', () => {
      const results = helpers.generateDocNames('shops');

      expect(results).to.be.an('array');
      expect(results.length).to.equal(0);
    });

    it('should return array with doc names', () => {
      const expectedResult = [
        'shops:docs:norman',
        'shops:docs:normanby'
      ];

      const results = helpers.generateDocNames('shops:docs:', [
        'norman',
        'normanby'
      ]);

      expect(results).to.be.an('array');
      expect(results.length).to.equal(2);
      expect(results).to.eql(expectedResult);
    });

  });

});
