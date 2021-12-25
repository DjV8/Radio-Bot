const loopMode = (queue, loopMode) => {
	const { loop } = queue;
	queue.loop = loop !== loopMode ? loopMode : null;
	return `Powtarzanie ${loopMode === 'kloop' ? 'kolejki' : ''} jest ${
		queue.loop ? 'włączone' : `wyłączone`
	}`;
};

export default loopMode;
