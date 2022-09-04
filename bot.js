import {
  createAudioPlayer,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnectionStatus,
} from '@discordjs/voice';
import {
  Client,
  Collection,
  GatewayIntentBits,
  PermissionsBitField,
} from 'discord.js';
import { readdirSync, readFileSync } from 'fs';
import { createInterface } from 'readline';
const { token, invite } = JSON.parse(readFileSync('config.json'));

import logger from './utilities/logger.mjs';
import connectToChannel from './utilities/connectToChannel.mjs';
import playFile from './utilities/playFile.mjs';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates],
});
const queue = new Map();

class queueStruct {
  constructor(textChannelID, voiceChannel) {
    this.textChannel = client.channels.cache.get(textChannelID);
    this.voiceChannel = voiceChannel;
    this.audioPlayer = createAudioPlayer();
    this.media = [];
    this.loop = 0; // 0 - no , 1 - single , 2 - queue
    this.playing = false;
  }
}

async function execute(interaction) {
  const { guildId: ID } = interaction;
  const serverQueue = queue.get(ID);
  const { voiceChannel: VC } = serverQueue;
  try {
    const connection = await connectToChannel(VC);
    logger.info(`Polaczono z kanalem ${VC.name}!`);
    connection.subscribe(serverQueue.audioPlayer);
    playFile(queue.get(ID));
    serverQueue.playing = true;
    serverQueue.audioPlayer
      .on(AudioPlayerStatus.Idle, () => {
        const { loop, media } = queue.get(ID);
        if (!loop) media.shift();
        if (loop == 2) media.push(media.shift());
        playFile(queue.get(ID));
      })
      .on('error', async (err) => {
        const { textChannel } = queue.get(ID);
        logger.error(err);
        textChannel.send(`Coś się popierdoliło: ${err}`);
        await import('./utilities/stop.mjs').then(({ stop }) => {
          stop(VC.guild.id);
        });
      });
    connection.on(VoiceConnectionStatus.Destroyed, () => {
      queue.delete(ID);
      logger.info(`Rozlaczono z kanalem ${VC.name}!`);
    });
  } catch (err) {
    queue.get(ID).textChannel.reply(`Coś poszło nie tak: ${err}`);
    logger.error(err);
    queue.delete(ID);
  }
}

client.commands = new Collection();
const commandPath = './Commands/';

const comandFiles = readdirSync(commandPath).filter((file) =>
  file.endsWith('.mjs')
);

for (const file of comandFiles) {
  await import(`${commandPath}${file}`).then(({ command }) => {
    client.commands.set(command.data.name, command);
  });
}

client.once('ready', () => {
  const CONSOLE = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const { botStatus } = JSON.parse(readFileSync('status.json'));
  let statusId = 0;
  setInterval(() => {
    // prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
    client.user.setPresence({
      activity: [
        {
          name: botStatus[statusId],
          type: 'PLAYING',
        },
      ],
      status: 'online',
    });
    statusId = statusId === botStatus.length - 1 ? 0 : statusId++;
  }, 6e5); //10min
  logger.info(`Zalogowano jako ${client.user.tag}!`);
  logger.info(`Link z zaproszeniem: ${invite}`);
  logger.info(`Jesem na ${client.guilds.cache.size} serwerach!`);
  CONSOLE.question('Wcisnij enter aby zakonczyc\n', () => {
    client.destroy();
    process.exit();
  });
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);
  if (!command) return;

  const {
    member: {
      voice: { channel: VC },
    },
    guildId,
  } = interaction;

  if (!queue.get(guildId)) queue.set(guildId, new queueStruct(interaction, VC));

  try {
    await command.execute(interaction, queue.get(guildId));
  } catch (error) {
    await interaction.reply({
      content: `Był problem podczas wykonywania polecenia: ${error}`,
      ephemeral: true,
    });
  }
  if (queue.get(guildId)?.media.length && !queue.get(guildId).playing) {
    try {
      const bot = interaction.guild.members.me;
      const botVoicePermissions = VC.permissionsFor(bot);
      if (!botVoicePermissions.has(PermissionsBitField.Flags.Connect)) {
        throw `nie moge wejśc na kanał: **"${VC.name}"**  😕`;
      }
      if (!botVoicePermissions.has(PermissionsBitField.Flags.Speak)) {
        throw `nie mogę mówić na kanale: "${VC.name}"  😕`;
      }
      execute(interaction);
    } catch (error) {
      await interaction.user.send(`Wystąpił błąd: ${error}`);
    }
  }
});
client.on('error', (error) => logger.error(error));
client.login(token);
