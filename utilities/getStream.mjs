import ytdl from 'ytdl-core';

const getStream = ({ type, url }) =>
	type === `yt` ? ytdl(url, { filter: 'audioonly', highWaterMark: 1 << 25 }) : url;

export default getStream;
