import stationFind from '../utilities/stationFind.mjs';
import { expect } from 'chai';

describe('Find stations tests', () => {
	it('Input:random numbers, it should return false', () => {
		expect(stationFind(6635759141)).to.be.false;
	});
	it('Input:random string, it should return false', () => {
		expect(stationFind('NeIO1iAdrZ')).to.be.false;
	});
	it('Input:undefined, it should return false', () => {
		expect(stationFind(undefined)).to.be.false;
	});
	it('Input:null, it should return false', () => {
		expect(stationFind(null)).to.be.false;
	});
	it('No input, it should return false', () => {
		expect(stationFind()).to.be.false;
	});
	it('Input: shortname of a station, it should return true', () => {
		expect(stationFind('rmf')).to.be.an('object');
	});
});
