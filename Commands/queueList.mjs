const queueList = (queue) => {
	let text = `\`\`\`Kolejka:\nWłaśnie leci: ${queue[0].name}`;
	for (let i = 1; i < queue.length; i++) text += `\n${i}: ${queue[i].name}`;
	return (text += '```');
};

export default queueList;
