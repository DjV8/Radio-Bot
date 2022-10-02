import getMediaInfo from '../utilities/getMediaInfo.mjs';
import { expect } from 'chai';

const tests = [
  {
    url: 'https://www.youtube.com/',
    message: 'parsing youtube main site, returns a error message',
    type: 'string',
  },
  {
    url: 'https://www.youtube.com/watch?v=a',
    message: 'parsing a unexisting youtube link, returns error message',
    type: 'string',
  },
  {
    url: 'https://youtu.be/0tCDdjy7r8A',
    message: 'parsing a short, valid link, returns a info object',
    type: 'object',
  },
];

describe('Test of getting data from youtube', async () => {
  tests.forEach(({ url, message, type }) => {
    it(message, async () => {
      let ytinfo;
      try {
        ytinfo = await getMediaInfo(url);
      } catch (error) {
        ytinfo = error;
      }
      expect(ytinfo).to.be.an(type);
    });
  });
});
