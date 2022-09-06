import { REST } from '@discordjs/rest';
import { Routes } from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
const { clientId, token, guildId } = JSON.parse(readFileSync('config.json'));

const commands = [];
const commandPath = './Commands/';

const comandFiles = readdirSync(commandPath).filter((file) =>
  file.endsWith('.mjs')
);

for (const file of comandFiles) {
  await import(`../Commands/${file}`).then(({ command }) => {
    commands.push(command.data);
  });
}

const rest = new REST({ version: '10' }).setToken(token);

//global

const deployGlobal = () => {
  rest
    .put(Routes.applicationCommands(clientId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
};

const removeGlobal = () => {
  rest
    .put(Routes.applicationCommands(clientId), { body: [] })
    .then(() => console.log('Successfully deleted all application commands.'))
    .catch(console.error);
};

//local
const deployLocal = () => {
  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
};

const removeLocal = () => {
  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
    .then(() => console.log('Successfully deleted all guild commands.'))
    .catch(console.error);
};

export function local() {
  removeLocal();
  deployLocal();
  return;
}

export function global() {
  removeGlobal();
  deployGlobal();
  return;
}

removeLocal();
global();
