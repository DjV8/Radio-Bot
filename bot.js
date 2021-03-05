import dotenv from "dotenv";
dotenv.config();

import { Client } from "discord.js";
import ytdl from "ytdl-core";
const CLIENT = new Client();
const QUEUE = new Map();
import { readFileSync } from "fs";
import { createInterface } from "readline";
import pkg from "winston"; // logger
const { format: _FORMAT, createLogger, transports: _TRANSPORTS } = pkg;

var radiostation = JSON.parse(readFileSync("stations.json", "utf8")); // wczytanie stacji

const CONSOLE = createInterface({
	input: process.stdin,
	output: process.stdout,
});

const LOGFORMAT = _FORMAT.printf(({ level, timestamp, message }) => {
	return `${level}:${timestamp}: ${message}`;
});

const logger = createLogger({
	level: "info",
	format: _FORMAT.combine(_FORMAT.timestamp(), LOGFORMAT),
	transports: [
		// - Write all logs with level `error` and below to `error.log`
		// - Write all logs with level `info` and below to `bot.log`
		new _TRANSPORTS.File({ filename: "error.log", level: "error" }),
		new _TRANSPORTS.File({ filename: "bot.log" }),
		new _TRANSPORTS.Console(),
	],
	exceptionHandlers: [new _TRANSPORTS.File({ filename: "exceptions.log" })],
});

CLIENT.on("ready", () => {
	var currStatus = 0;
	var serverCount = CLIENT.guilds.cache.size;
	var statusList = [
		"Zawołaj pomocy jak potrzebujesz 😉",
		`Jesem na ${serverCount} serwerach!`,
		"Ram pam pam",
		"🎶🎶🎶",
	];

	setInterval(async () => {
		serverCount = CLIENT.guilds.cache.size;
		statusList[1] = `Jesem na ${serverCount} serwerach!`;
	}, 864e5); //co 24h

	setInterval(async () => {
		CLIENT.user.setPresence({
			// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
			activity: {
				name: `${statusList[currStatus]}`,
				type: "PLAYING",
			},
			status: "online",
		});
		currStatus++;
		if (currStatus == statusList.length) currStatus = 0;
	}, 6e5); // co 6 min

	logger.info(`Zalogowano jako ${CLIENT.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);
	CONSOLE.question("Wcisnij enter aby zakonczyc\n", () => {
		CLIENT.destroy();
		process.exit();
	});
});

CLIENT.on("message", async (message) => {
	// główny handler wiadomości
	if (message.author.bot) return;

	if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES")) {
		message.author.send("Mordo nie mogę pisać").catch((err) => logger.error(err));
		return;
	}
	if (message.content.toLowerCase().includes("twoja stara"))
		if (message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES"))
			message.channel.send("zapierdala");
	if (
		!message.content.startsWith("<@" + CLIENT.user + ">") &&
		!message.content.startsWith("<@!" + CLIENT.user + ">")
	)
		return;

	const SERVERQUEUE = QUEUE.get(message.guild.id);
	const args = message.content.split(" ");

	if (!args[1]) return message.channel.send("czego kurwa");

	if (
		args[1] === "odśwież" &&
		(message.author.id === "409704685969342503" || message.author.id === "304668018108137472")
	)
		return refresh(message);

	switch (args[1]) {
		case "odpal":
			execute(message, SERVERQUEUE);
			break;
		case "idź":
			stop_radio(message, SERVERQUEUE);
			break;
		case "stacje":
			list_stations(message);
			break;
		case "pomocy":
			help(message);
			break;
		case "pomiń":
			skip(message, SERVERQUEUE);
			break;
		case "loop":
			loop(message, SERVERQUEUE);
			break;
		case "kloop":
			kloop(message, SERVERQUEUE);
			break;
		default:
			message.reply("nie wie jak korzystać z bota");
			break;
	}
});

async function execute(message, queue) {
	var voiceChannel = message.member.voice.channel;
	var textChannel = message.channel;
	if (!checkIfOnChannel(voiceChannel, textChannel)) return;
	const permissions = voiceChannel.permissionsFor(CLIENT.user);
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
		return textChannel.send("No bym wbił ale nie moge 😕");
	if (!checkIfOnSameVC(voiceChannel, textChannel, queue)) return;

	const MEDIAINFO = {
		url: null,
		name: null,
		yt: null,
	};
	const args = message.content.split(" ");

	if (args[2].includes("youtube.com") || args[2].includes("youtu.be")) {
		try {
			const ytinfo = await ytdl.getInfo(args[2]);
			MEDIAINFO.url = args[2];
			MEDIAINFO.name = ytinfo.videoDetails.title;
			MEDIAINFO.yt = true;
		} catch (err) {
			logger.info(err);
			return textChannel.send("Nie ma takiego filmu");
		}
	} else {
		const stationNr = findStation(args[2]);
		if (stationNr == -1) return textChannel.send("O ch*j ci chodzi?");
		const STATIONINFO = radiostation.stations[stationNr];
		MEDIAINFO.url = STATIONINFO.url;
		MEDIAINFO.name = STATIONINFO.desc;
		MEDIAINFO.yt = false;
	}

	if (!queue) {
		const MEDIACONSTRUCT = {
			textChannel: textChannel,
			voiceChannel: voiceChannel,
			connection: null,
			media: [],
			volume: 5,
			lastName: null,
			loop: false,
			kloop: false,
		};
		QUEUE.set(message.guild.id, MEDIACONSTRUCT);
		MEDIACONSTRUCT.media.push(MEDIAINFO);

		try {
			var connection = await voiceChannel.join();
			logger.info(`Polaczono z kanalem ${voiceChannel.name}!`);
			MEDIACONSTRUCT.connection = connection;
			play(message.guild);
			connection.on("disconnect", () => {
				QUEUE.delete(message.guild.id);
				logger.info(`Rozlaczono z kanalem ${voiceChannel.name}!`);
			});
		} catch (err) {
			logger.error(err);
			QUEUE.delete(message.guild.id);
			return;
		}
	} else {
		queue.media.push(MEDIAINFO);
		textChannel.send(`${MEDIAINFO.name} dodano do kolejki!`);
	}
}

function checkIfOnChannel(voiceChannel, textChannel) {
	if (!voiceChannel) {
		textChannel.send("Najpierw wbij gdzieś!");
		return false;
	}
	return true;
}
function checkIfQueue(queue, textChannel) {
	if (!queue) {
		textChannel.send("Brak kolejki!");
		return false;
	}
	return true;
}
function checkIfOnSameVC(voiceChannel, textChannel, queue) {
	if (queue && queue.voiceChannel != voiceChannel) {
		textChannel.send("Przecież ciebie nawet tu nie ma");
		return false;
	}
	return true;
}
function checkOnOrderCHange(voiceChannel, textChannel, queue) {
	if (
		!checkIfOnChannel(voiceChannel, textChannel) ||
		!checkIfQueue(queue, textChannel) ||
		!checkIfOnSameVC(voiceChannel, textChannel, queue)
	)
		return false;
	return true;
}

function skip(message, queue) {
	var voiceChannel = message.member.voice.channel;
	var textChannel = message.channel;
	if (!checkOnOrderCHange(voiceChannel, textChannel, queue)) return;
	if (queue.loop) queue.media.shift();
	queue.connection.dispatcher.end();
}

function play(guild) {
	const SERVERQUEUE = QUEUE.get(guild.id);

	if (!SERVERQUEUE.media[0]) {
		SERVERQUEUE.voiceChannel.leave();
		return;
	}

	var dispatcher;
	if (SERVERQUEUE.media[0].yt) {
		dispatcher = SERVERQUEUE.connection.play(
			ytdl(SERVERQUEUE.media[0].url, { filter: "audioonly", highWaterMark: 1 << 25 })
		);
	} else dispatcher = SERVERQUEUE.connection.play(SERVERQUEUE.media[0].url);
	dispatcher
		.on("finish", () => {
			if (SERVERQUEUE.kloop) SERVERQUEUE.media.push(SERVERQUEUE.media[0]);
			if (!SERVERQUEUE.loop) SERVERQUEUE.media.shift();
			play(guild);
		})
		.on("error", (err) => {
			logger.error(err);
			SERVERQUEUE.textChannel.send(`Coś się popierdoliło: ${err}`);
			SERVERQUEUE.voiceChannel.leave();
		});

	dispatcher.setVolumeLogarithmic(SERVERQUEUE.volume / 5);
	if (SERVERQUEUE.lastName != SERVERQUEUE.media[0].name)
		SERVERQUEUE.textChannel.send(`Właśnie leci: **${SERVERQUEUE.media[0].name}**`);
	SERVERQUEUE.lastName = SERVERQUEUE.media[0].name;
}

function loop(message, queue) {
	var textChannel = message.channel;
	if (!checkOnOrderCHange(message.member.voice.channel, textChannel, queue)) return;
	queue.loop = !queue.loop;
	queue.kloop = false;
	if (queue.loop) textChannel.send("Powtarzanie włączone");
	else textChannel.send("Powtarzanie wyłączone");
}

function kloop(message, queue) {
	var textChannel = message.channel;
	if (!checkOnOrderCHange(message.member.voice.channel, textChannel, queue)) return;
	queue.kloop = !queue.kloop;
	queue.loop = false;
	if (queue.kloop) textChannel.send("Powtarzanie kolejki włączone");
	else textChannel.send("Powtarzanie kolejki wyłączone");
}

function findStation(searchWord) {
	var i = 0;
	while (radiostation.stations[i]) {
		if (radiostation.stations[i].shortname === searchWord) return i;
		i++;
	}
	return -1;
}

function stop_radio(message, queue) {
	var textChannel = message.channel;
	if (!checkOnOrderCHange(message.member.voice.channel, textChannel, queue)) return;
	textChannel.send("okok");
	queue.media = [];
	queue.connection.dispatcher.end();
}

/*function stop_radio_silent(queue) {
	queue.media = [];
	queue.connection.dispatcher.end();
}
CLIENT.on("voiceStateUpdate", (oldMember) => {
	const queue = QUEUE.get(oldMember.guild.id)
	if (!queue) return
	if (queue.voiceChannel.members.size === 1) {
		stop_radio_silent(queue);
	}
})*/

function list_stations(message) {
	var i = 0;

	var msg = "```Dostępne stacje:";

	while (radiostation.stations[i]) {
		msg = msg.concat(
			"\n",
			radiostation.stations[i].shortname,
			" - ",
			radiostation.stations[i].desc
		);
		i++;
	}

	message.channel.send(msg.concat("````"));
}

function refresh(message) {
	radiostation = JSON.parse(readFileSync("stations.json"));
	message.channel.send("Odświeżam");
}

function help(message) {
	message.channel.send(
		"```Dostępne polecenia:\n@Radio odpal < nazwa stacji > / <link z yt> - dołącza do kanału i odtwarza wybrane radio/film z linka\n@Radio idź - przestaje grać i wychodzi z kanału\n@Radio stacje - wyświetla dostępne stacje\n@Radio loop - zapętlanie utworów\n@Radio kloop - zapętla całą kolejkę \n@Radio pomiń - pomija element z kolejki```"
	);
}

CLIENT.on("error", (error) => {
	logger.error(error);
});

CLIENT.login(process.env.BOT_TOKEN);
