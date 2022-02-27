import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
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

const rest = new REST({ version: '9' }).setToken(token);

//global
/* rest.put(Routes.applicationCommands(clientId), { body: commands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error); */

rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: globalCommands })
	.then(() => console.log('Successfully registered application commands.'))
	.catch(console.error);
