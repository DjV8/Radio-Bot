import ytdl from 'ytdl-core';
import logger from '../utilities/logger.mjs';
import stop from '../utilities/stop.mjs';

const play = (queue) => {
	const current = queue.media[0];
	if (!current) return stop(queue.voicechannel);
	const { url, type } = current;
	const stream = type === `yt` ? ytdl(url, { filter: 'audioonly' }) : url;
	const dispatcher = queue.connection.play(stream);
	dispatcher
		.on('finish', () => {
			if (queue.loop === 'kloop') queue.media.push(current);
			if (queue.loop !== 'loop') queue.media.shift();
			play(queue);
		})
		.on('error', (err) => {
			logger.error(err);
			queue.textChannel.send(`Coś się popierdoliło: ${err}`);
			stop(queue.voicechannel);
		});
	dispatcher.setVolumeLogarithmic(queue.volume / 5);
};
export default play;
