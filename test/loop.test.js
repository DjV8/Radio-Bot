import { expect } from 'chai';
import loopMode from '../Commands/loop.mjs';

const loopTest = new Map();

loopTest.set('0', { loop: null });

describe('Modify loop mode', () => {
	it('Loop value should be null', () => {
		expect(loopTest.get('0').loop).to.be.equal(null);
	});
	it("Should change loop value to 'loop'", () => {
		loopMode(loopTest.get('0'), 'loop');
		expect(loopTest.get('0').loop).to.be.equal('loop');
	});
	it("Should change loop value to 'kloop'", () => {
		loopMode(loopTest.get('0'), 'kloop');
		expect(loopTest.get('0').loop).to.be.equal('kloop');
	});
	it('Should return that loop is of', () => {
		expect(loopMode(loopTest.get('0'), 'kloop')).to.be.equal(
			'Powtarzanie kolejki jest wyłączone'
		); // queue loop off messqage
	});
	it('Should return that loop is on', () => {
		expect(loopMode(loopTest.get('0'), 'loop')).to.be.equal('Powtarzanie jest włączone'); // normal loop on messqage
	});
	it('Should return that loop is of', () => {
		expect(loopMode(loopTest.get('0'), 'loop')).to.be.equal('Powtarzanie jest wyłączone'); // normal loop off messqage
	});
});
