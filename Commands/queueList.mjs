const queueList = (queue) =>
	queue.lenght()
		? `\`\`\`Kolejka:\nWłaśnie leci: ${queue[0].title} ${queue
				.map(({ title }, index) => `\n${index}: ${title}`)
				.slice(1)} \`\`\``
		: 'Kolejka jest pusta.';
export default queueList;
