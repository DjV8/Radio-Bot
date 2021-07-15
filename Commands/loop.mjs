const loopMode = (queue, loopMode) => {
	const { loop } = queue;
	queue.loop = loop === null || loop !== loopMode ? loopMode : null;
	return `Powtarzanie ${loopMode === 'kloop' ? 'kolejki' : ''} ${
		queue.loop == null ? `wyłączone` : 'włączone'
	}`;
};

export default loopMode;
