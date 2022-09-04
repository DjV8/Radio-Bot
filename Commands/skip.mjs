import { SlashCommandBuilder } from 'discord.js';

export const command = {
  data: new SlashCommandBuilder()
    .setName('pomiń')
    .setDescription('Pomiń obecnie lesący utwór')
    .setDMPermission(false),
  async execute(interaction, { voiceChannel, media, loop, audioPlayer }) {
    let reply;
    try {
      if (!(voiceChannel === interaction.member.voice.channel))
        throw ' Musisz być na kanale głosowym ze mną by wpływać na kolejkę';
      if (!media.length) throw `Nie ma czego pominąć!`;
      if (loop === 1) serverQueue.media.shift(); // probably the branch statement should be removed
      audioPlayer.stop();
      reply = 'Utwór pominięty!';
    } catch (error) {
      reply = error;
    } finally {
      await interaction.reply(reply);
    }
  },
};
