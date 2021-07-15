import stationFind from '../utilities/findStation.mjs';
import { expect } from 'chai';

describe('Find stations tests', () => {
	it('Input:random numbers, it should return false', () => {
		expect(stationFind(6635759141)).to.be.equal(undefined);
	});
	it('Input:random string, it should return false', () => {
		expect(stationFind('NeIO1iAdrZ')).to.be.equal(undefined);
	});
	it('Input:undefined, it should return false', () => {
		expect(stationFind(undefined)).to.be.equal(undefined);
	});
	it('Input:null, it should return false', () => {
		expect(stationFind(null)).to.be.equal(undefined);
	});
	it('No input, it should return false', () => {
		expect(stationFind()).to.be.equal(undefined);
	});
	it('Input: shortname of a station, it should return true', () => {
		expect(stationFind('rmf')).to.be.an('object');
	});
});
