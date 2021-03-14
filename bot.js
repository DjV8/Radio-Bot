import dotenv from "dotenv";
import { Client } from "discord.js";
import ytdl from "ytdl-core";
import { readFileSync } from "fs";
import { createInterface } from "readline";
import pkg from "winston"; // logger
dotenv.config();
const { format: _FORMAT, createLogger, transports: _TRANSPORTS } = pkg;
const client = new Client();
const queue = new Map();
const LOGFORMAT = _FORMAT.printf(({ level, timestamp, message }) => {
	return `${level}:${timestamp}: ${message}`;
});
const logger = createLogger({
	level: "info",
	format: _FORMAT.combine(_FORMAT.timestamp(), LOGFORMAT),
	transports: [
		new _TRANSPORTS.File({ filename: "error.log", level: "error" }),
		new _TRANSPORTS.File({ filename: "bot.log" }),
		new _TRANSPORTS.Console(),
	],
	exceptionHandlers: [new _TRANSPORTS.File({ filename: "exceptions.log" })],
});
const CONSOLE = createInterface({
	input: process.stdin,
	output: process.stdout,
});
let radiostation;
function checkIfQueue(queue, textChannel) {
	if (!queue) {
		textChannel.send(`Brak kolejki!`);
		return false;
	}
	return true;
}
function checkIfOnVC(voiceChannel, textChannel, queue) {
	if (!voiceChannel) {
		textChannel.send("Najpierw wbij gdzieś!");
		return false;
	}
	if (queue && queue.voiceChannel != voiceChannel) {
		textChannel.send("Przecież ciebie nawet tu nie ma");
		return false;
	}
	return true;
}
async function execute(message, serverQueue, link) {
	class getInfo {
		constructor(url, title, status) {
			this.url = url;
			this.name = title;
			this.yt = status;
		}
	}
	const voiceChannel = message.member.voice.channel;
	const channel = message.channel;
	let mediaInfo;
	if (link.includes("youtube.com") || link.includes("youtu.be"))
		try {
			const ytinfo = await ytdl.getInfo(link);
			mediaInfo = new getInfo(link, ytinfo.videoDetails.title, true);
		} catch (err) {
			logger.info(err);
			return channel.send(`Nie ma takiego filmu`);
		}
	else {
		const stationInfo = stationsFind(link);
		if (!stationInfo) return channel.send("Nie wiem co masz na myśli");
		mediaInfo = new getInfo(stationInfo.url, stationInfo.desc, false);
	}
	if (!serverQueue) {
		const mediaConstruct = {
			textChannel: channel,
			voiceChannel: voiceChannel,
			connection: null,
			media: [],
			volume: 5,
			lastName: null,
			loop: false,
			kloop: false,
		};
		queue.set(message.guild.id, mediaConstruct);
		mediaConstruct.media.push(mediaInfo);
		try {
			const connection = await voiceChannel.join();
			logger.info(`Polaczono z kanalem ${voiceChannel.name}!`);
			mediaConstruct.connection = connection;
			play(message.guild);
			connection.on("disconnect", () => {
				queue.delete(message.guild.id);
				logger.info(`Rozlaczono z kanalem ${voiceChannel.name}!`);
			});
		} catch (err) {
			logger.error(err);
			return queue.delete(message.guild.id);
		}
	} else {
		serverQueue.media.push(mediaInfo);
		channel.send(`${mediaInfo.name} dodano do kolejki!`);
	}
}
function loop(channel, queue, loopMode) {
	let text = `Powtarzanie `;
	if (loopMode === "loop") queue.kloop = false;
	else {
		queue.loop = false;
		text += `kolejki `;
	}
	queue[loopMode] = !queue[loopMode];
	if (queue.loop === queue.kloop) channel.send((text += `wyłączone`));
	else channel.send((text += `włączone`));
}
function play(guild) {
	const serverQueue = queue.get(guild.id);
	if (!serverQueue.media[0]) return serverQueue.voiceChannel.leave();
	let dispatcher;
	if (serverQueue.media[0].yt)
		dispatcher = serverQueue.connection.play(
			ytdl(serverQueue.media[0].url, { filter: "audioonly", highWaterMark: 1 << 25 })
		);
	else dispatcher = serverQueue.connection.play(serverQueue.media[0].url);
	dispatcher
		.on("finish", () => {
			if (serverQueue.kloop) serverQueue.media.push(serverQueue.media[0]);
			if (!serverQueue.loop) serverQueue.media.shift();
			play(guild);
		})
		.on("error", (err) => {
			logger.error(err);
			serverQueue.textChannel.send(`Coś się popierdoliło: ${err}`);
			serverQueue.voiceChannel.leave();
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
	if (serverQueue.lastName != serverQueue.media[0].name) {
		serverQueue.textChannel.send(`Właśnie leci: **${serverQueue.media[0].name}**`);
		serverQueue.lastName = serverQueue.media[0].name;
	}
}
function queueList(channel, queue) {
	let text = "```" + `Kolejka:\nWłaśnie leci: ${queue[0].name}`;
	for (let i = 1; i < queue.length; i++) text += `\n${i} ${queue[i].name}`;
	channel.send((text += "```"));
}
function skip(queue) {
	if (queue.loop) queue.media.shift();
	queue.connection.dispatcher.end();
}
function stationsFind(searchWord) {
	let placeholder = null;
	radiostation.stations.forEach((station) => {
		if (station.shortname === searchWord) return (placeholder = station);
	});
	return placeholder;
}
function stationsList(channel) {
	let msg = "```Dostępne stacje:";
	radiostation.stations.forEach((station) => (msg += `\n${station.shortname} - ${station.desc}`));
	channel.send((msg += "```"));
}
function stationsRefresh() {
	radiostation = JSON.parse(readFileSync("stations.json"));
}
function stop(queue) {
	queue.media = [];
	queue.connection.dispatcher.end();
}
client.on("ready", () => {
	let list = [
		`Zawołaj pomocy jak potrzebujesz 😉`,
		`Jesem na ${client.guilds.cache.size} serwerach!`,
		`Ram pam pam`,
		`🎶🎶🎶`,
	];
	setInterval(async () => (list[2] = `Jesem na ${client.guilds.cache.size} serwerach!`), 864e5); //24h
	setInterval(async () => {
		client.user.setPresence({
			// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
			activity: {
				name: list[0],
				type: "PLAYING",
			},
			status: "online",
		});
		list.push(list.shift());
	}, 6e5); //10 min => 24h - 144 razy =>  144 %4 = 0 => git z odświeżaniem
	logger.info(`Zalogowano jako ${client.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);
	CONSOLE.question("Wcisnij enter aby zakonczyc\n", () => {
		client.destroy();
		process.exit();
	});
	stationsRefresh(); //wczytanie stacji
});
client.on("message", async (message) => {
	if (message.author.bot) return;
	if (!message.content.startsWith(`<@!${client.user.id}>`)) return;
	if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES"))
		return message.author.send(`Mordo nie mogę pisać`).catch((err) => logger.error(err));
	const ARGS = message.content.replace(/\s+/g, " ").split(" ");
	if (!ARGS[1]) return message.channel.send("czego kurwa");
	const SERVERQUEUE = queue.get(message.guild.id);
	let id = -1;
	const commands = JSON.parse(readFileSync("commands.json"));
	commands.commands.forEach((command, i) => {
		if (ARGS[1] === command.name) return (id = i);
	});
	if (id == -1) return message.reply("nie wie jak korzystać z bota");
	else if (id < 3)
		if (id == 0) {
			const ADMINID = process.env.ADMIN.split(",");
			ADMINID.forEach((ADMINID) => {
				if (message.author.id === ADMINID) {
					stationsRefresh();
					message.channel.send("Odświeżam");
				}
			});
		} else if (id == 1) stationsList(message.channel);
		else {
			commands.commands.shift();
			let msg = "```Dostępne polecenia:";
			commands.commands.forEach((command) => {
				msg += `\n@Radio ${command.name} - ${command.desc}`;
			});
			message.channel.send((msg += "```"));
		}
	else if (checkIfOnVC(message.member.voice.channel, message.channel, SERVERQUEUE)) {
		if (id == 3) {
			message.channel.send("okok");
			stop(SERVERQUEUE);
		} else if (id == 4) {
			const permissions = message.member.voice.channel.permissionsFor(message.client.user);
			if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
				message.channel.send("No bym wbił ale nie moge 😕");
			else execute(message, SERVERQUEUE, ARGS[2]);
		} else if (checkIfQueue(SERVERQUEUE, message.channel))
			if (id == 5) queueList(message.channel, SERVERQUEUE.media);
			else if (id == 6 || id == 7) loop(message.channel, SERVERQUEUE, ARGS[1]);
			else skip(SERVERQUEUE);
	}
});
client.on("error", (error) => logger.error(error));
client.login(process.env.BOT_TOKEN);
