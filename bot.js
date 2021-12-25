import dotenv from 'dotenv';
import { Client } from 'discord.js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

import logger from './utilities/logger.mjs';
import getMediaInfo from './utilities/getMediaInfo.mjs';

import play from './Commands/play.mjs';
import queueList from './Commands/queueList.mjs';
import skip from './Commands/skip.mjs';
import help from './Commands/help.mjs';
import stop from './utilities/stop.mjs';
import loopMode from './Commands/loop.mjs';
import stationsList from './Commands/stationsList.mjs';

dotenv.config();

const client = new Client();
const queue = new Map();

class queueStruct {
	constructor(textChannel, voiceChannel) {
		this.textChannel = textChannel;
		this.voiceChannel = voiceChannel;
		this.connection = null;
		this.media = [];
		this.volume = 5;
		this.loop = null;
	}
}

async function execute({ member, channel, guild }, serverQueue, link) {
	const voiceChannel = member.voice.channel;
	const mediaInfo = await getMediaInfo(link);
	if (typeof mediaInfo === 'string') return channel.send(mediaInfo);
	serverQueue.media = serverQueue.media.concat(mediaInfo);
	queue.set(guild.id, serverQueue);
	if (!serverQueue.connection)
		try {
			const connection = await voiceChannel.join();
			logger.info(`Polaczono z kanalem ${voiceChannel.name}!`);
			serverQueue.connection = connection;
			channel.send(`Kolejkę możesz zawsze sprawdzić poleceniem \'queue\'`);
			play(queue.get(guild.id));
			connection.on('disconnect', () => {
				queue.delete(guild.id);
				logger.info(`Rozlaczono z kanalem ${voiceChannel.name}!`);
			});
		} catch (err) {
			logger.error(err);
			return queue.delete(guild.id);
		}
	else channel.send(`Dodano **${mediaInfo.title || 'playlistę'}** do kolejki!`);
}

client.on('ready', () => {
	const CONSOLE = createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	const { botStatus } = JSON.parse(readFileSync('status.json'));
	let statusIndex = 0;
	setInterval(() => {
		// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
		client.user.setPresence({
			activity: {
				name: botStatus[statusIndex],
				type: 'PLAYING',
			},
			status: 'online',
		});
		statusIndex = statusIndex === botStatus.length - 1 ? 0 : statusIndex + 1;
	}, 6e5); //10min\
	logger.info(`Zalogowano jako ${client.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);
	logger.info(`Jesem na ${client.guilds.cache.size} serwerach!`);
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
		return author.send(`Mordo nie mogę pisać`).catch((err) => logger.error(err));
	const ARGS = content.replace(/\s+/g, ' ').split(' ');
	if (!ARGS[1]) return channel.send('czego kurwa');
	const SERVERQUEUE =
		queue.get(message.guild.id) || new queueStruct(channel, member.voice.channel);
	const { commands } = JSON.parse(readFileSync('commands.json'));
	const id = commands.findIndex(({ name }) => name === ARGS[1]);

	if (id === 0) return channel.send(stationsList());
	if (id === 1) return channel.send(help(commands));
	if (SERVERQUEUE.voiceChannel !== member.voice.channel || !member.voice.channel)
		return message.reply(' musisz być na kanale głosowym ze mną by to wykonać');

	if (id === 3) {
		const permissions = member.voice.channel.permissionsFor(message.client.user);
		if (!permissions.has('CONNECT')) return channel.send('No bym wbił ale nie moge 😕');
		if (!permissions.has('SPEAK')) return channel.send('Sorry ale nie mogę mówić  😕');
		return execute(message, SERVERQUEUE, ARGS[2]);
	}
	if (SERVERQUEUE.media.length == 0) return channel.send(`Brak kolejki!`);
	if (id === 2) {
		channel.send('Ok Ok');
		return stop(SERVERQUEUE.voiceChannel);
	}
	if (id === 4) return channel.send(queueList(SERVERQUEUE.media));
	if (id === 5 || id === 6) return channel.send(loopMode(SERVERQUEUE, ARGS[1]));
	if (id === 7) {
		skip(SERVERQUEUE);
		return channel.send('Już się robi!');
	}
	return message.reply('nie wie jak korzystać z bota');
});
client.on('error', (error) => logger.error(error));
client.login(process.env.BOT_TOKEN);
