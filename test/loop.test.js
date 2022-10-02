/**import { expect } from 'chai';
import command from '../Commands/loop.mjs';

const loopTest = new Map();
loopTest.set('0', { loop: 0 });

const tests = [
  {
    input: 0,
    message: 'Check if it can read the loop value, expect to be 0',
    output: 0,
  },
  {
    value: 'NeIO1iAdrZ',
    message: 'Input: some characters, expected to return false',
    type: 'undefined',
  },
  {
    value: null,
    message: 'Input: none, expected to return false',
    type: 'undefined',
  },
  {
    value: 'rmf',
    message: 'Input: shortname of a station, expected to return true',
    type: 'object',
  },
];

describe('Modify loop mode', () => {
  it('Should change loop value to 1', () => {
    loopMode(loopTest.get('0'), 1);
    expect(loopTest.get('0').loop).to.be.equal(1);
  });
  it('Should change loop value to 2', () => {
    loopMode(loopTest.get('0'), 2);
    expect(loopTest.get('0').loop).to.be.equal(2);
  });
  it('Should return that loop is of', () => {
    expect(loopMode(loopTest.get('0'), 2)).to.be.equal(
      'Powtarzanie kolejki jest wyłączone'
    ); // queue loop off messqage
  });
  it('Should return that loop is on', () => {
    expect(loopMode(loopTest.get('0'), 1)).to.be.equal(
      'Powtarzanie jest włączone'
    ); // normal loop on messqage
  });
  it('Should return that loop is of', () => {
    expect(loopMode(loopTest.get('0'), 1)).to.be.equal(
      'Powtarzanie jest wyłączone'
    ); // normal loop off messqage
  });
});
*/
