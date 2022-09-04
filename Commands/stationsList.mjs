import { SlashCommandBuilder } from 'discord.js';

import stationsLoad from '../utilities/loadStations.mjs';

//chenge message formating

export const command = {
  data: new SlashCommandBuilder()
    .setName('stacje')
    .setDescription('wyświetla dostępne radio stacje')
    .setDMPermission(true),
  async execute(interaction) {
    let reply;
    try {
      reply = `\`\`\`Dostępne stacje: ${stationsLoad().stations.map(
        ({ shortname, desc }) => `\n${shortname} - ${desc}`
      )}\`\`\``;
    } catch (error) {
      reply = error;
    } finally {
      await interaction.reply(reply);
    }
  },
};
