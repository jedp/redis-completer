'use strict';

const expect = require('chai').expect;

const helpers = require('../lib/helpers');

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

  describe('parseLine', () => {
    it('should return a shop object if more data passed', () => {

    });
  });

});
