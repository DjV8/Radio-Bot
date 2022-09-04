import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('pętla')
    .setDescription('Zapętlania utworu/ utworów')
    .setDMPermission(false)
    .addNumberOption((option) =>
      option
        .setName('typ')
        .setDescription('Typ zapętlania')
        .setRequired(true)
        .addChoices(
          { name: 'Brak', value: 0 },
          { name: 'Aktualny Utwór', value: 1 },
          { name: 'Cała Kolejka', value: 2 }
        )
    ),

  async execute(interaction, serverQueue) {
    let reply;
    try {
      if (serverQueue.voiceChannel !== interaction.member.voice.channel)
        throw 'Musisz być na kanale głosowym ze mną by wpływać na kolejkę';
      if (!serverQueue.media.length) throw `Nic akutalnie nie puszczam!`;
      const loopMode = interaction.options.get('typ').value;
      serverQueue.loop = serverQueue.loop !== loopMode ? loopMode : 0;
      reply = `Powtarzanie ${loopMode === 2 ? 'kolejki ' : ''}jest ${
        serverQueue.loop ? 'włączone' : `wyłączone`
      }`;
    } catch (error) {
      reply = error;
    } finally {
      await interaction.reply(reply);
    }
  },
};
