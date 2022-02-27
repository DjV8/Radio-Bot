import {
	createAudioPlayer,
	AudioPlayerStatus,
	getVoiceConnection,
	VoiceConnectionStatus,
} from '@discordjs/voice';
import { Client, Intents, Permissions } from 'discord.js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';
const { token, invite } = JSON.parse(readFileSync('config.json'));

import logger from './utilities/logger.mjs';
import getMediaInfo from './utilities/getMediaInfo.mjs';
import connectToChannel from './utilities/connectToChannel.mjs';

import queueList from './Commands/queueList.mjs';
import skip from './Commands/skip.mjs';
import help from './Commands/help.mjs';
import stop from './utilities/stop.mjs';
import loopMode from './Commands/loop.mjs';
import stationsList from './Commands/stationsList.mjs';
import play from './Commands/play.mjs';

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES],
});
const queue = new Map();

class queueStruct {
	constructor(textChannelID, voiceChannel) {
		this.textChannel = client.channels.cache.get(textChannelID);
		this.voiceChannel = voiceChannel;
		this.audioPlayer = createAudioPlayer();
		this.media = [];
		this.loop = null;
	}
}

async function execute(interaction) {
	const { guildId: ID } = interaction;
	const link = interaction.options.get('src').value;
	const mediaInfo = await getMediaInfo(link);
	if (typeof mediaInfo === 'string') return interaction.reply(mediaInfo);
	const serverQueue = queue.get(ID);
	serverQueue.media = serverQueue.media.concat(mediaInfo);
	const { voiceChannel: VC } = serverQueue;
	const connection = getVoiceConnection(VC.guild.id);
	if (!connection)
		try {
			const connection = await connectToChannel(VC);
			logger.info(`Polaczono z kanalem ${VC.name}!`);
			interaction.reply(`Kolejkę możesz zawsze sprawdzić poleceniem \'queue\'`);
			connection.subscribe(serverQueue.audioPlayer);
			play(queue.get(ID));
			serverQueue.audioPlayer
				.on(AudioPlayerStatus.Idle, () => {
					const { loop, media } = queue.get(ID);
					switch (loop) {
						case 'kloop':
							media.push(media.shift());
							break;
						case 'loop':
							break;
						default:
							media.shift();
							break;
					}
					play(queue.get(ID));
				})
				.on('error', (err) => {
					const { textChannel: TC } = queue.get(ID);
					logger.error(err);
					TC.send(`Coś się popierdoliło: ${err}`);
					stop(VC.guild.id);
				});
			connection.on(VoiceConnectionStatus.Destroyed, () => {
				queue.delete(ID);
				logger.info(`Rozlaczono z kanalem ${VC.name}!`);
			});
		} catch (err) {
			logger.error(err);
			queue.delete(ID);
		}
	else interaction.reply(`Dodano **${mediaInfo.title || 'playlistę'}** do kolejki!`);
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
	const {
		commandName,
		member: {
			voice: { channel: VC },
			guild: { me: bot },
		},
		channelId,
		guildId,
	} = interaction;
	const textChannel = client.channels.cache.get(channelId);
	const botTextPermissions = textChannel.permissionsFor(bot);
	if (!interaction.isCommand() || !guildId) return;
	if (!botTextPermissions.has(Permissions.FLAGS.SEND_MESSAGES)) {
		return interaction.user
			.send(`Mordo nie mogę pisać na kanale "${textChannel.name}"`)
			.catch((err) => logger.error(err));
	}

	const { commands } = JSON.parse(readFileSync('commands.json'));
	const id = commands.findIndex(({ name }) => name === commandName);
	const isOnSameVC = Boolean(queue.get(guildId)?.voiceChannel === VC);
	const isMedia = Boolean(queue.get(guildId)?.media);
	switch (true) {
		case id == 0:
			interaction.reply(stationsList());
			break;
		case id == 1:
			interaction.reply(help(commands));
			break;
		case id == 3:
			if (!queue.get(guildId)) queue.set(guildId, new queueStruct(interaction, VC));
			const botVoicePermissions = VC.permissionsFor(bot);
			if (!botVoicePermissions.has(Permissions.FLAGS.CONNECT))
				return interaction.reply(`No bym wbił na kanał "${VC.name}" ale nie moge 😕`);
			if (!botVoicePermissions.has(Permissions.FLAGS.SPEAK))
				return interaction.reply(`Sorry ale nie mogę mówić na "${VC.name}"  😕`);
			execute(interaction);
			break;
		case id == 4 && isMedia:
			interaction.reply(queueList(queue.get(guildId).media));
			break;
		case id == 2 && isOnSameVC && isMedia:
			stop(VC.guild.id);
			interaction.reply('Już wychodzę smh');
			break;
		case (id == 5 || id == 6) && isOnSameVC && isMedia:
			interaction.reply(loopMode(queue.get(guildId), commandName));
			break;
		case id == 7 && isOnSameVC && isMedia:
			interaction.reply('Już się robi!');
			skip(queue.get(guildId));
			break;
		default:
			if (!isMedia) interaction.reply(`Brak kolejki!`);
			else if (!isOnSameVC)
				interaction.reply(' Musisz być na kanale głosowym ze mną by to wykonać');
			break;
	}
});
client.on('error', (error) => logger.error(error));
client.login(token);
