import { InteractionCollector, SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('kolejka')
    .setDescription('wyświetla obecną kolejkę')
    .setDMPermission(false),
  async execute(interaction, { media }) {
    let reply;
    try {
      if (!media.length) throw `Kolejka jest pusta!`;
      reply = `\`\`\`Kolejka:\nWłaśnie leci: ${media[0].title} ${media
        .map(({ title }, index) => `\n${index}: ${title}`)
        .slice(1)} \`\`\``;
    } catch (error) {
      reply = error;
    } finally {
      await interaction.reply(reply);
    }
  },
};
