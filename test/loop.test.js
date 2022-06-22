import { expect } from 'chai';
import loopMode from '../Commands/loop.mjs';

const loopTest = new Map();

loopTest.set('0', { loop: 0 });

describe('Modify loop mode', () => {
	it('Loop value should be 0', () => {
		expect(loopTest.get('0').loop).to.be.equal(0);
	});
	it('Should change loop value to 1', () => {
		loopMode(loopTest.get('0'), 1);
		expect(loopTest.get('0').loop).to.be.equal(1);
	});
	it('Should change loop value to 2', () => {
		loopMode(loopTest.get('0'), 2);
		expect(loopTest.get('0').loop).to.be.equal(2);
	});
	it('Should return that loop is of', () => {
		expect(loopMode(loopTest.get('0'), 2)).to.be.equal('Powtarzanie kolejki jest wyłączone'); // queue loop off messqage
	});
	it('Should return that loop is on', () => {
		expect(loopMode(loopTest.get('0'), 1)).to.be.equal('Powtarzanie jest włączone'); // normal loop on messqage
	});
	it('Should return that loop is of', () => {
		expect(loopMode(loopTest.get('0'), 1)).to.be.equal('Powtarzanie jest wyłączone'); // normal loop off messqage
	});
});
