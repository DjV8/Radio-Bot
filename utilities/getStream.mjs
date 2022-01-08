import ytdl from 'ytdl-core-discord';
import convertLocalMedia from './convertLocalMedia.mjs';
const getStream = async ({ source, url }) => {
	switch (source) {
		case 'yt':
			return { stream: await ytdl(url), type: 'opus' };
		case 'local':
			return { stream: convertLocalMedia(url), type: 'opus' };
		default:
			return { stream: url };
	}
};

export default getStream;
