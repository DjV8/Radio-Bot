import getMediaInfo from '../Commands/getMediaInfo.mjs';
import { expect } from 'chai';

describe('Test of getting data from youtube', async () => {
	it('parsing youtube main site, it should returna a message', async () => {
		const ytinfo = await getMediaInfo('youtube.com');
		expect(ytinfo).to.be.an('string');
	});
	it('parsing a unexisting youtube link, it should returna a message ', async () => {
		const ytinfo = await getMediaInfo('https://www.youtube.com/watch?v=a');
		expect(ytinfo).to.be.an('string');
	});
	it('parsing a short, valid link, it should return a info object', async () => {
		const ytinfo = await getMediaInfo('https://youtu.be/0tCDdjy7r8A');
		expect(ytinfo).to.be.an('object');
	});
});
