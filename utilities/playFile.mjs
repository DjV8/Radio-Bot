import getStream from './getStream.mjs';
import stop from './stop.mjs';

const play = async ({ voiceChannel: VC, media: [current], audioPlayer }) => {
  try {
    if (!current) return stop(VC.guild.id);
    audioPlayer.play(await getStream(current));
  } catch (error) {
    console.log(`play file: ${error} `);
  }
};

export default play;
