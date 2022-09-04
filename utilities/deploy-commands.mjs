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

// add commands
//global
const deployGlobal = () => {
  rest
    .put(Routes.applicationCommands(clientId), { body: globalCommands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
};
//local
const deployLocal = () => {
  rest
    .put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);
};
// remove commands

const removeGlobal = () => {
  rest.get(Routes.applicationGuildCommands(clientId, guildId)).then((data) => {
    const promises = [];
    for (const command of data) {
      const deleteUrl = `${Routes.applicationCommands(clientId)}/${command.id}`;
      promises.push(rest.delete(deleteUrl));
    }
    return Promise.all(promises);
  });
};

//local
const removeLocal = () => {
  rest.get(Routes.applicationGuildCommands(clientId, guildId)).then((data) => {
    const promises = [];
    for (const command of data) {
      const deleteUrl = `${Routes.applicationGuildCommands(
        clientId,
        guildId
      )}/${command.id}`;
      promises.push(rest.delete(deleteUrl));
    }
    return Promise.all(promises);
  });
};

export const reDeplo = (scope) => {
  if (scope == 'local') {
    removeLocal();
    deployLocal();
    return;
  }
  if (scope == 'global') {
    removeGlobal();
    deployGlobal();
    return;
  }
};
