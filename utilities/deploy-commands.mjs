import { SlashCommandBuilder } from '@discordjs/builders';
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { clientId, token, guildId } = JSON.parse(readFileSync('config.json'));
import { readFileSync } from 'fs';

const { commands } = JSON.parse(readFileSync('commands.json'));

const globalCommands = commands.map(({ name, desc, parameter }) => {
	if (parameter) {
		const { item, info, req } = parameter;
		return new SlashCommandBuilder()
			.setName(name)
			.setDescription(desc)
			.addStringOption((option) =>
				option.setName(item).setDescription(info).setRequired(req)
			);
	} else return new SlashCommandBuilder().setName(name).setDescription(desc);
});
globalCommands.map((command) => command.toJSON());

const rest = new REST({ version: '10' }).setToken(token);

// add commands
//global
/*rest.put(Routes.applicationCommands(clientId), { body: globalCommands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);*/

//local
rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: globalCommands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);

// remove commands

//global
/*rest.get(Routes.applicationGuildCommands(clientId, guildId)).then((data) => {
	const promises = [];
	for (const command of data) {
		const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	return Promise.all(promises);
});*/

//local
/*rest.get(Routes.applicationGuildCommands(clientId, guildId)).then((data) => {
	const promises = [];
	for (const command of data) {
		const deleteUrl = `${Routes.applicationGuildCommands(clientId, guildId)}/${command.id}`;
		promises.push(rest.delete(deleteUrl));
	}
	return Promise.all(promises);
});*/
