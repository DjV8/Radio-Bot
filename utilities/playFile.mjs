import getStream from './getStream.mjs';
import stop from './stop.mjs';
import logger from './logger.mjs';

const play = async ({ voiceChannel: VC, media: [current], audioPlayer }) => {
  try {
    if (!current) return stop(VC.guild.id);
    audioPlayer.play(await getStream(current));
  } catch (error) {
    logger.error(error);
    throw error.message;
  }
};

export default play;
