import getStream from '../utilities/getStream.mjs';

const play = async ({ voiceChannel: VC, media: [current], audioPlayer }) => {
	if (!current) return stop(VC.guild.id);
	audioPlayer.play(await getStream(current));
};

export default play;
