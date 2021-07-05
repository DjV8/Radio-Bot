const loopMode = (queue, loopMode) => {
	let returnMessage = 'Powtarzanie';
	queue.loop = queue.loop == null || queue.loop != loopMode ? loopMode : null;
	returnMessage += loopMode == 'kloop' ? ' kolejki ' : ' ';
	return (returnMessage += queue.loop == null ? `wyłączone` : 'włączone');
};

export default loopMode;
