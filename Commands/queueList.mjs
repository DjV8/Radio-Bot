const queueList = (queue) =>
	`\`\`\`Kolejka:\nWłaśnie leci: ${queue[0].title} ${queue
		.map(({ title }, index) => `\n${index}: ${title}`)
		.slice(1)} \`\`\``;

export default queueList;
