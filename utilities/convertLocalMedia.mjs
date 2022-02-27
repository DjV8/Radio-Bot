/*
 * !!! Not mande by me !!!
 * It's a copy of code from here:
 * https://github.com/amishshah/prism-media/blob/main/examples/mp3-to-opus.js
 */

// This example converts an MP3 file stream to an Opus packet stream

import { createReadStream } from 'fs';
import prism from 'prism-media';

// Any input that FFmpeg accepts can be used here -- you could use mp4 or wav for example.
const convertLocalMedia = (url) => {
	const input = createReadStream(url);
	const transcoder = new prism.FFmpeg({
		args: [
			'-analyzeduration',
			'0',
			'-loglevel',
			'0',
			'-f',
			's16le',
			'-ar',
			'48000',
			'-ac',
			'2',
		],
	});

	const opus = new prism.opus.Encoder({ rate: 48000, channels: 2, frameSize: 960 });

	return input.pipe(transcoder).pipe(opus);
};

export default convertLocalMedia;
/* The output could for example be played in Discord.js as an Opus stream if you would like to manually control
   how the opus stream is generated */
