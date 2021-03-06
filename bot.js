import dotenv from 'dotenv';
import { Client } from 'discord.js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';
import ytdl from 'ytdl-core-discord';

import logger from './utilities/logger.mjs';
import getMediaInfo from './Commands/getMediaInfo.mjs';
import stationsList from './Commands/stationsList.mjs';
import loopMode from './Commands/loop.mjs';
import queueList from './Commands/queueList.mjs';
import skip from './Commands/skip.mjs';
import help from './Commands/help.mjs';
import stop from './Commands/stop.mjs';

dotenv.config();

const client = new Client();
const queue = new Map();

async function execute({ member, channel, guild }, serverQueue, link) {
	const voiceChannel = member.voice.channel;
	const mediaInfo = await getMediaInfo(link);
	if (typeof mediaInfo === 'string') return channel.send(mediaInfo);
	serverQueue.media.push(mediaInfo);
	queue.set(guild.id, serverQueue);
	if (!serverQueue.connection)
		try {
			const connection = await voiceChannel.join();
			logger.info(`Polaczono z kanalem ${voiceChannel.name}!`);
			serverQueue.connection = connection;
			channel.send(
				`Kolejkę możesz zawsze sprawdzić poleceniem \'queue\'`
			);
			play(guild);
			connection.on('disconnect', () => {
				queue.delete(guild.id);
				logger.info(`Rozlaczono z kanalem ${voiceChannel.name}!`);
			});
		} catch (err) {
			logger.error(err);
			return queue.delete(guild.id);
		}
	else channel.send(`${mediaInfo.name} dodano do kolejki!`);
}

async function play(guild) {
	const serverQueue = queue.get(guild.id);
	if (!serverQueue.media[0]) return serverQueue.voiceChannel.leave();
	const dispatcher =
		serverQueue.media[0].type == `yt`
			? serverQueue.connection.play(
					await ytdl(serverQueue.media[0].url),
					{ type: 'opus' }
			  )
			: serverQueue.connection.play(serverQueue.media[0].url);
	dispatcher
		.on('finish', () => {
			if (serverQueue.loop == 'kloop')
				serverQueue.media.push(serverQueue.media[0]);
			if (serverQueue.loop != 'loop') serverQueue.media.shift();
			play(guild);
		})
		.on('error', (err) => {
			logger.error(err);
			serverQueue.textChannel.send(`Coś się popierdoliło: ${err}`);
			serverQueue.voiceChannel.leave();
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

client.on('ready', () => {
	const CONSOLE = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	const { bot_status: botStatus } = JSON.parse(readFileSync('status.json'));
	botStatus.push(`Jesem na ${client.guilds.cache.size} serwerach!`);
	let statusIndex = 0;
	setInterval(
		async () =>
			botStatus.splice(
				-1,
				-1,
				`Jestem na ${client.guilds.cache.size} serwerach!`
			),
		864e5
	); //`24h
	setInterval(async () => {
		client.user.setPresence({
			// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
			activity: {
				name: botStatus[statusIndex],
				type: 'PLAYING',
			},
			status: 'online',
		});
		statusIndex = statusIndex === botStatus.length ? 0 : statusIndex + 1;
	}, 6e5); // 10 min
	logger.info(`Zalogowano jako ${client.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);
	CONSOLE.question('Wcisnij enter aby zakonczyc\n', () => {
		client.destroy();
		process.exit();
	});
});
client.on('message', async (message) => {
	const { channel, author, member, content } = message;
	if (author.bot) return;
	if (!content.startsWith(`<@!${client.user.id}>`)) return;
	if (!channel.permissionsFor(message.client.user).has('SEND_MESSAGES'))
		return author
			.send(`Mordo nie mogę pisać`)
			.catch((err) => logger.error(err));
	const ARGS = content.replace(/\s+/g, ' ').split(' ');
	if (!ARGS[1]) return channel.send('czego kurwa');
	const SERVERQUEUE = !queue.get(message.guild.id)
		? {
				textChannel: channel,
				voiceChannel: member.voice.channel,
				connection: null,
				media: [],
				volume: 5,
				loop: null,
		  }
		: queue.get(message.guild.id);
	let id = -1;
	const { commands } = JSON.parse(readFileSync('commands.json'));
	for (const command of commands) {
		if (ARGS[1] === command.name) {
			id = command.id;
			break;
		}
	}
	if (id == -1) return message.reply('nie wie jak korzystać z bota');
	else if (id == 0) channel.send(stationsList());
	else if (id == 1) channel.send(help(commands));
	else if (SERVERQUEUE.voiceChannel == member.voice.channel) {
		if (id == 3) {
			const permissions = member.voice.channel.permissionsFor(
				message.client.user
			);
			if (!permissions.has('CONNECT') || !permissions.has('SPEAK'))
				channel.send('No bym wbił ale nie moge 😕');
			else execute(message, SERVERQUEUE, ARGS[2]);
		} else if (id == 2) {
			channel.send('okok');
			stop(SERVERQUEUE);
		} else if (SERVERQUEUE.media)
			if (id == 4) channel.send(queueList(SERVERQUEUE.media));
			else if (id == 5 || id == 6)
				channel.send(loopMode(SERVERQUEUE, ARGS[1]));
			else skip(SERVERQUEUE);
		else channel.send(`Brak kolejki!`);
	} else message.reply(' musisz być na kanale głosowym ze mną by to wykonać');
});
client.on('error', (error) => logger.error(error));
client.login(process.env.BOT_TOKEN);
