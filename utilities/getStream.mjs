import ytdl from 'ytdl-core';
import convertLocalMedia from './convertLocalMedia.mjs';
import { createAudioResource, StreamType } from '@discordjs/voice';

const getStream = async ({ source, url }) => {
	let stream = null,
		inputType = StreamType.Arbitrary;
	switch (source) {
		case 'yt':
			stream = ytdl(url, {
				filter: 'audioonly',
				highWaterMark: 1 << 25,
			});
			break;
		case 'local':
			stream = convertLocalMedia(url);
			inputType = StreamType.Opus;
			break;
		default:
			stream = url;
			break;
	}
	return createAudioResource(stream, { inputType });
};

export default getStream;
