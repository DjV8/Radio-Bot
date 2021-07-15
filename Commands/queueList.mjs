const queueList = (queue) =>
  `\`\`\`Kolejka:\nWłaśnie leci: ${queue[0].name} ${queue
    .map(({ name }, index) => `\n${index}: ${name}`)
    .slice(1)} \`\`\``;

export default queueList;
