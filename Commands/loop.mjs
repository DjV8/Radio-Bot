const loopMode = (queue, loopMode) => {
	queue.loop = queue.loop !== loopMode ? loopMode : 0;
	return `Powtarzanie ${loopMode === 2 ? 'kolejki ' : ''}jest ${
		queue.loop ? 'włączone' : `wyłączone`
	}`;
};

export default loopMode;
