import { getVoiceConnection } from '@discordjs/voice';

const stop = (channelId) => {
	const connection = getVoiceConnection(channelId);
	connection.destroy();
};

export default stop;
