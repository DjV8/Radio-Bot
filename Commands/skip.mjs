const skip = (queue) => {
	if (queue.loop === 'loop') queue.media.shift();
	queue.audioPlayer.stop();
};
export default skip;
