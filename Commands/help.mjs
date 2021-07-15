const help = (commands) =>
	`\`\`\`Dostępne polecenia: ${commands.map(
		({ name, desc }) => `\n@Radio ${name} - ${desc}`
	)} \`\`\``;

export default help;
