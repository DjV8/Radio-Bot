import { SlashCommandBuilder } from 'discord.js';
import stop from '../utilities/stop.mjs';

export const command = {
  data: new SlashCommandBuilder()
    .setName('idź')
    .setDescription('przestaje grać i opuszcza kanał głosowy')
    .setDMPermission(false),
  async execute(interaction, { voiceChannel, media }) {
    let reply;
    try {
      if (!media.length) throw `Nie jestem nawet na kanale głosowym!`;
      if (voiceChannel !== interaction.member.voice.channel)
        throw 'Musisz być na kanale głosowym ze mną by to zrobić';
      stop(voiceChannel.guild.id);
      reply = 'Już wychodzę smh';
    } catch (error) {
      reply = error;
    } finally {
      interaction.reply(reply);
    }
  },
};
