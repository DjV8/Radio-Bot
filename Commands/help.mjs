const help = (commands) =>
	`\`\`\`Dostępne polecenia: ${commands.map(({ name, desc }) => `\n/${name} - ${desc}`)} \`\`\``;

export default help;
