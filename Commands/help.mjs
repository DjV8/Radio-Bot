function help(commands) {
	let msg = '```Dostępne polecenia:';
	for (const command of commands)
		msg += `\n@Radio ${command.name} - ${command.desc}`;
	return (msg += '```');
}
export default help;
