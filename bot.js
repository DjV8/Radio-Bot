import dotenv from "dotenv";
import { Client } from "discord.js";
import ytdl from "ytdl-core";
import { readFileSync } from "fs";
import { createInterface } from "readline";
import pkg from "winston"; // logger
dotenv.config();
const { format: _FORMAT, createLogger, transports: _TRANSPORTS } = pkg; // wczytanie stacji
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
	// interfejs konsoli
	input: process.stdin,
	output: process.stdout,
});
let radiostation = JSON.parse(readFileSync("stations.json")); // wczytanie stacji
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
	let mediaInfo;
	if (link.includes("youtube.com") || link.includes("youtu.be")) {
		try {
			const ytinfo = await ytdl.getInfo(link);
			mediaInfo = new getInfo(link, ytinfo.videoDetails.title, true);
		} catch (err) {
			logger.info(err);
			return message.channel.send(`Nie ma takiego filmu`);
		}
	} else {
		const stationInfo = findStation(link);
		if (!stationInfo) return message.channel.send("Nie wiem co masz na myśli");
		mediaInfo = new getInfo(stationInfo.url, stationInfo.desc, false);
	}
	if (!serverQueue) {
		const mediaConstruct = {
			textChannel: message.channel,
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
			var connection = await voiceChannel.join();
			logger.info(`Polaczono z kanalem ${voiceChannel.name}!`);
			mediaConstruct.connection = connection;
			play(message.guild);
			connection.on("disconnect", () => {
				queue.delete(message.guild.id);
				logger.info(`Rozlaczono z kanalem ${voiceChannel.name}!`);
			});
		} catch (err) {
			logger.error(err);
			queue.delete(message.guild.id);
			return;
		}
	} else {
		serverQueue.media.push(mediaInfo);
		message.channel.send(`${mediaInfo.name} dodano do kolejki!`);
	}
}
function findStation(searchWord) {
	let placeholder = null;
	radiostation.stations.forEach((station) => {
		if (station.shortname === searchWord) placeholder = station;
	});
	return placeholder;
}
function list_stations(channel) {
	let msg = "```Dostępne stacje:\n";
	radiostation.stations.forEach((station) => {
		msg += `${station.shortname} - ${station.desc}\n`;
	});
	channel.send((msg += "```"));
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

	if (!serverQueue.media[0]) {
		serverQueue.voiceChannel.leave();
		return;
	}

	var dispatcher;
	if (serverQueue.media[0].yt) {
		dispatcher = serverQueue.connection.play(
			ytdl(serverQueue.media[0].url, { filter: "audioonly", highWaterMark: 1 << 25 })
		);
	} else {
		dispatcher = serverQueue.connection.play(serverQueue.media[0].url);
	}
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
	}
	serverQueue.lastName = serverQueue.media[0].name;
}
function queueList(channel, queue) {
	let text = "```" + `Kolejka:\nWłaśnie leci:${queue[0].name}\n`;
	for (let i = 1; i < queue.length; i++) text += `${i} ${queue[i].name}\n`;
	channel.send((text += "```"));
}
function refresh(channel) {
	radiostation = JSON.parse(readFileSync("stations.json"));
	channel.send("Odświeżam");
}
function skip(queue) {
	if (queue.loop) queue.media.shift();
	queue.connection.dispatcher.end();
}
function stop_radio(queue) {
	queue.media = [];
	queue.connection.dispatcher.end();
}
client.on("ready", () => {
	let id = 0;
	let list = [
		`Zawołaj pomocy jak potrzebujesz 😉`,
		`Jesem na ${client.guilds.cache.size} serwerach!`,
		`Ram pam pam`,
		`🎶🎶🎶`,
	];

	setInterval(async () => (list[1] = `Jesem na ${client.guilds.cache.size} serwerach!`), 864e5); //co 24h
	setInterval(async () => {
		client.user.setPresence({
			// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
			activity: {
				name: list[id],
				type: "PLAYING",
			},
			status: "online",
		});
		id++;
		if (id == list.length) id = 0;
	}, 6e5); // co 10 min

	logger.info(`Zalogowano jako ${client.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);
	CONSOLE.question("Wcisnij enter aby zakonczyc\n", () => {
		client.destroy();
		process.exit();
	});
});
client.on("message", async (message) => {
	if (message.author.bot) return;
	if (
		!message.content.startsWith("<@" + client.user + ">") &&
		!message.content.startsWith("<@!" + client.user + ">")
	)
		return;
	if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES"))
		return message.author.send(`Mordo nie mogę pisać`).catch((err) => logger.error(err));
	//if (message.content.toLowerCase().includes("twoja stara"))
	//return message.channel.send("zapierdala");
	const ARGS = message.content.replace(/\s+/g, " ").split(" ");
	if (!ARGS[1]) return message.channel.send("czego kurwa");
	const SERVERQUEUE = queue.get(message.guild.id);
	switch (ARGS[1]) {
		case "odpal":
			if (checkIfOnVC(message.member.voice.channel, message.channel, SERVERQUEUE)) {
				const permissions = message.member.voice.channel.permissionsFor(
					message.client.user
				);
				if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
					return message.channel.send("No bym wbił ale nie moge 😕");
				execute(message, SERVERQUEUE, ARGS[2]);
			}
			break;
		case "idź":
			if (checkIfOnVC(message.member.voice.channel, message.channel, SERVERQUEUE)) {
				message.channel.send("okok");
				stop_radio(SERVERQUEUE);
			}
			break;
		case "stacje":
			list_stations(message.channel);
			break;
		case "odśwież":
			const ADMINID = process.env.ADMIN.split(",");
			ADMINID.forEach((ADMINID) => {
				if (message.author.id === ADMINID) refresh(message.channel);
			});
			break;
		case "pomocy":
			message.channel.send(
				"```Dostępne polecenia:\n@Radio odpal < nazwa stacji > / <link z yt> - dołącza do kanału i odtwarza wybrane radio/film z linka\n@Radip queue - pokazuję aktualną kolejke \n@Radio idź - przestaje grać i wychodzi z kanału\n@Radio stacje - wyświetla dostępne stacje\n@Radio loop - zapętlanie utworów\n@Radio kloop - zapętla całą kolejkę \n@Radio pomiń - pomija element z kolejki```"
			);
			break;
		case "pomiń":
			if (
				checkIfOnVC(message.member.voice.channel, message.channel, SERVERQUEUE) &&
				checkIfQueue(SERVERQUEUE, message.channel)
			)
				skip(SERVERQUEUE);
			break;
		case "loop":
		case "kloop":
			if (
				checkIfOnVC(message.member.voice.channel, message.channel, SERVERQUEUE) &&
				checkIfQueue(SERVERQUEUE, message.channel)
			)
				loop(message.channel, SERVERQUEUE, ARGS[1]);
			break;
		case "queue":
			if (checkIfQueue(SERVERQUEUE, message.channel))
				queueList(message.channel, SERVERQUEUE.media);
			break;
		default:
			message.reply("nie wie jak korzystać z bota");
			break;
	}
});
client.on("error", (error) => {
	logger.error(error);
});
client.login(process.env.BOT_TOKEN);
