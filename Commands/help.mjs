import { SlashCommandBuilder } from 'discord.js';
import { readdirSync } from 'fs';
export const command = {
  data: new SlashCommandBuilder()
    .setName('pomocy')
    .setDescription('wyświetla listę dostępnych poleceń')
    .setDMPermission(true),
  async execute(interaction) {
    let reply;
    try {
      const comandFiles = readdirSync('./Commands');
      const commands = [];
      for (const file of comandFiles) {
        await import(`../Commands/${file}`).then(({ command }) => {
          commands.push(command.data);
        });
      }
      reply = `\`\`\`Dostępne polecenia: ${commands.map(
        ({ name, description }) => `\n/${name} - ${description}`
      )} \`\`\``;
    } catch (error) {
      reply = error;
    } finally {
      await interaction.reply(reply);
    }
  },
};
