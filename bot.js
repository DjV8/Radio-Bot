import dotenv from "dotenv";
dotenv.config();

import { Client } from "discord.js";
import pkg_ytdl from "ytdl-core";
const { getInfo } = pkg_ytdl;
const client = new Client();
const queue = new Map();
import { readFileSync } from "fs";
import { createInterface } from "readline";
import pkg from "winston";
const { format: _format, createLogger, transports: _transports } = pkg;

var radiostation = JSON.parse(readFileSync("stations.json", "utf8")); // wczytanie stacji

client.on("ready", () => {
	// Inicjacja bota
	var currStatus = 0;

	setInterval(async () => {
		var serverCount = client.guilds.cache.size; // liczenie serwerów
		var statusList = [
			// możliwe statusy
			"Zawołaj pomocy jak potrzebujesz 😉",
			"Jesem na " + serverCount + " serwerach!",
			"Ram pam pam",
			"🎶🎶🎶",
		];

		if (currStatus == statusList.length) currStatus = 0;

		client.user.setPresence({
			// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
			activity: {
				name: `${statusList[currStatus]}`,
				type: "PLAYING",
			},
			status: "online",
		});
		//client.user.setActivity(`${statusList[random]}`);
		currStatus++;
	}, 60000); //delay

	logger.info(`Zalogowano jako ${client.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);

	rl.question("Wcisnij enter aby zakonczyc\n", () => {
		// zakończenie bota w konsoli
		client.destroy();
		process.exit();
	});
});

const logFormat = _format.printf(({ level, timestamp, message }) => {
	return `${level}:${timestamp}: ${message}`;
});

const logger = createLogger({
	// logger winston
	level: "info",
	format: _format.combine(_format.timestamp(), logFormat),
	transports: [
		// - Write all logs with level `error` and below to `error.log`
		// - Write all logs with level `info` and below to `bot.log`
		new _transports.File({ filename: "error.log", level: "error" }),
		new _transports.File({ filename: "bot.log" }),
		new _transports.Console(),
	],
	exceptionHandlers: [new _transports.File({ filename: "exceptions.log" })],
});

const rl = createInterface({
	// interfejs konsoli
	input: process.stdin,
	output: process.stdout,
});

client.on("message", async (message) => {
	// główny handler wiadomości
	if (message.author.bot) return;
	if (message.content.toLowerCase().includes("twoja stara"))
		if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES")) return;
		else message.channel.send("zapierdala");
	if (
		!message.content.startsWith("<@" + client.user + ">") &&
		!message.content.startsWith("<@!" + client.user + ">")
	)
		return;
	if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES")) {
		message.author.send("Mordo nie mogę pisać").catch((err) => logger.error(err));
		return;
	}

	const serverQueue = queue.get(message.guild.id);
	const args = message.content.split(" ");

	if (!args[1]) return message.channel.send("czego kurwa");

	if (
		args[1] === "odśwież" &&
		(message.author.id === "409704685969342503" || message.author.id === "304668018108137472")
	)
		return refresh(message);

	switch (args[1]) {
		case "odpal":
			execute(message, serverQueue);
			break;
		case "idź":
			stop_radio(message, serverQueue);
			break;
		case "stacje":
			list_stations(message);
			break;
		case "pomocy":
			help(message);
			break;
		case "pomiń":
			skip(message, serverQueue);
			break;
		case "loop":
			loop(message, serverQueue);
			break;
		case "kloop":
			kloop(message, serverQueue);
			break;
		default:
			message.reply("nie wie jak korzystać z bota");
			break;
	}
});

async function execute(message, serverQueue) {
	const args = message.content.split(" ");
	const voiceChannel = message.member.voice.channel;
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!voiceChannel) return message.channel.send("Najpierw wbij gdzieś!");
	if (!permissions.has("CONNECT") || !permissions.has("SPEAK"))
		return message.channel.send("No bym wbił ale nie moge 😕");
	if (serverQueue)
		if (serverQueue.voiceChannel != voiceChannel)
			return message.channel.send("Przecież ciebie nawet tu nie ma");

	const mediaInfo = {
		url: null,
		name: null,
		yt: null,
	};

	if (args[2].includes("youtube.com") || args[2].includes("youtu.be")) {
		try {
			const ytinfo = await getInfo(args[2]);
			mediaInfo.url = args[2];
			mediaInfo.name = ytinfo.videoDetails.title;
			mediaInfo.yt = true;
		} catch (err) {
			logger.info(err);
			return message.channel.send("Nie ma takiego filmu");
		}
	} else {
		const stationNr = findStation(args[2]);
		if (stationNr == -1) return message.channel.send("O ch*j ci chodzi?");
		const stationInfo = radiostation.stations[stationNr];
		mediaInfo.url = stationInfo.url;
		mediaInfo.name = stationInfo.desc;
		mediaInfo.yt = false;
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

function checkIfHere(message, text) {
	const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) return message.channel.send("Najpierw wbij gdzieś!");
	if (!serverQueue && text != null) return message.channel.send(text);
	if (serverQueue.voiceChannel != voiceChannel)
		return message.channel.send("Przecież ciebie nawet tu nie ma");
}

function skip(message, serverQueue) {
	checkIfHere(message, `Nie ma czego pominąć!`);
	if (serverQueue.loop) serverQueue.media.shift();
	serverQueue.connection.dispatcher.end();
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
	} else dispatcher = serverQueue.connection.play(serverQueue.media[0].url);
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
	if (serverQueue.lastName != serverQueue.media[0].name)
		serverQueue.textChannel.send(`Właśnie leci: **${serverQueue.media[0].name}**`);
	serverQueue.lastName = serverQueue.media[0].name;
}

function loop(message, serverQueue) {
	checkIfHere(message, `Nie ma czego zapętlać!`);
	serverQueue.loop = !serverQueue.loop;
	serverQueue.kloop = false;
	if (serverQueue.loop) message.channel.send("Powtarzanie włączone");
	else message.channel.send("Powtarzanie wyłączone");
}

function kloop(message, serverQueue) {
	checkIfHere(message, `Nie ma czego zapętlać!`);
	serverQueue.kloop = !serverQueue.kloop;
	serverQueue.loop = false;
	if (serverQueue.kloop) message.channel.send("Powtarzanie kolejki włączone");
	else message.channel.send("Powtarzanie kolejki wyłączone");
}

function findStation(searchWord) {
	var i = 0;

	while (radiostation.stations[i]) {
		if (radiostation.stations[i].shortname === searchWord) {
			return i;
		}
		i++;
	}
	return -1;
}

function stop_radio(message, serverQueue) {
	checkIfHere(message, null);
	message.channel.send("okok");
	serverQueue.media = [];
	serverQueue.connection.dispatcher.end();
}

/*function stop_radio_silent(serverQueue) {
	serverQueue.media = [];
	serverQueue.connection.dispatcher.end();
}
client.on("voiceStateUpdate", (oldMember) => {
	const serverQueue = queue.get(oldMember.guild.id)
	if (!serverQueue) return
	if (serverQueue.voiceChannel.members.size === 1) {
		stop_radio_silent(serverQueue);
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

	message.channel.send(msg.concat("```"));
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

client.on("error", (error) => {
	logger.error(error);
});

client.login(process.env.BOT_TOKEN);
