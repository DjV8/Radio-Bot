const loopMode = (queue, loopMode) => {
	queue.loop = queue.loop !== loopMode ? loopMode : null;
	return `Powtarzanie ${loopMode === 'kloop' ? 'kolejki ' : ''}jest ${
		queue.loop ? 'włączone' : `wyłączone`
	}`;
};

export default loopMode;
