const queueList = (queue) => {
	const text = `\`\`\`Kolejka:\nWłaśnie leci: ${queue[0].name}`;
	for (let i = 1; i < queue.length; i++)
		text.concat(`\n${i} ${queue[i].name}`);
	return text.concat('```');
};

export default queueList;
