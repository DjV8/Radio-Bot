import { getVoiceConnection } from '@discordjs/voice';

const stop = (channelId) => {
  try {
    const connection = getVoiceConnection(channelId);
    connection.destroy();
  } catch (error) {
    console.log(`stop: ${error} `);
  }
};

export default stop;
