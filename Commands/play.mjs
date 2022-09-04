import { SlashCommandBuilder } from 'discord.js';
import getMediaInfo from '../utilities/getMediaInfo.mjs';

export const command = {
  data: new SlashCommandBuilder()
    .setName('odpal') // should change name
    .setDescription('dołącza do kanału i odtwarza wybrane źródło')
    .setDMPermission(false)
    .addStringOption((option) =>
      option
        .setName('src')
        .setDescription(
          'źródło jakie chcesz odpalić: film/ playlista z yt, nazwa radiostacji'
        )
        .setRequired(true)
    ),

  async execute(interaction, serverQueue) {
    let reply;
    try {
      if (serverQueue.voiceChannel !== interaction.member.voice.channel)
        throw 'Musisz być na kanale głosowym ze mną by coś doddać do kolejki';
      const link = interaction.options.get('src').value;
      const mediaInfo = await getMediaInfo(link);
      serverQueue.media = serverQueue.media.concat(mediaInfo);
      reply = `Dodano **${mediaInfo.title || 'playlistę'}** do kolejki!`;
    } catch (error) {
      reply = error;
    } finally {
      await interaction.reply(reply);
    }
  },
};
