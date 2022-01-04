import dotenv from 'dotenv';
import { Client } from 'discord.js';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

import logger from './utilities/logger.mjs';
import getMediaInfo from './utilities/getMediaInfo.mjs';
import getStream from './utilities/getStream.mjs';

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

function play(ID) {
	const serverQueue = queue.get(ID);
	const {
		voiceChannel: VC,
		media: [current],
	} = queue.get(ID);
	if (!current) return stop(VC);
	const dispatcher = serverQueue.connection.play(getStream(current));
	dispatcher
		.on('finish', () => {
			const { loop } = queue.get(ID);
			if (loop === 'kloop') serverQueue.media.push(current);
			if (loop != 'loop') serverQueue.media.shift();
			play(ID);
		})
		.on('error', (err) => {
			const { textChannel: TC } = serverQueue;
			logger.error(err);
			TC.send(`Coś się popierdoliło: ${err}`);
			stop(VC);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}
async function execute(TC, ID, serverQueue, link) {
	const mediaInfo = await getMediaInfo(link);
	if (typeof mediaInfo === 'string') return TC.send(mediaInfo);
	serverQueue.media = serverQueue.media.concat(mediaInfo);
	if (!serverQueue.connection)
		try {
			const { voiceChannel: VC } = serverQueue;
			const connection = await VC.join();
			logger.info(`Polaczono z kanalem ${VC.name}!`);
			serverQueue.connection = connection;
			TC.send(`Kolejkę możesz zawsze sprawdzić poleceniem \'queue\'`);
			play(ID);
			connection.on('disconnect', () => {
				queue.delete(ID);
				logger.info(`Rozlaczono z kanalem ${VC.name}!`);
			});
		} catch (err) {
			logger.error(err);
			queue.delete(ID);
		}
	else TC.send(`Dodano **${mediaInfo.title || 'playlistę'}** do kolejki!`);
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
	const {
		channel: TC,
		author,
		member: {
			voice: { channel: VC },
		},
		content,
		guild: { id: guildId },
	} = message;
	if (author.bot) return;
	if (!content.startsWith(`<@!${client.user.id}>`)) return;

	if (!TC.permissionsFor(message.client.user).has('SEND_MESSAGES'))
		return author.send(`Mordo nie mogę pisać`).catch((err) => logger.error(err));
	const ARGS = content.replace(/\s+/g, ' ').split(' ');
	if (!ARGS[1]) return TC.send('czego kurwa');
	const { commands } = JSON.parse(readFileSync('commands.json'));
	const id = commands.findIndex(({ name }) => name === ARGS[1]);
	if (id === -1) message.reply('nie wie jak korzystać z bota');
	else if (id === 0) TC.send(stationsList());
	else if (id === 1) TC.send(help(commands));
	else {
		if (!queue.get(guildId)) queue.set(guildId, new queueStruct(TC, VC));
		const { voiceChannel } = queue.get(guildId);
		if (voiceChannel === VC) {
			if (id === 3) {
				const permissions = VC.permissionsFor(message.client.user);
				if (!permissions.has('CONNECT')) TC.send('No bym wbił ale nie moge 😕');
				else if (!permissions.has('SPEAK')) TC.send('Sorry ale nie mogę mówić  😕');
				else execute(TC, guildId, queue.get(guildId), ARGS[2]);
			} else if (id === 2) stop(voiceChannel);
			else {
				const { media } = queue.get(guildId);
				if (media)
					if (id === 4) TC.send(queueList(media));
					else if (id === 5 || id === 6) TC.send(loopMode(queue.get(guildId), ARGS[1]));
					else {
						TC.send('Już się robi!');
						skip(queue.get(guildId));
					}
				else TC.send(`Brak kolejki!`);
			}
		} else message.reply(' musisz być na kanale głosowym ze mną by to wykonać');
	}
});
client.on('error', (error) => logger.error(error));
client.login(process.env.BOT_TOKEN);
