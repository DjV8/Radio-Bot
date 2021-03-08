import dotenv from "dotenv";
dotenv.config();

import { Client } from "discord.js";
import ytdl from "ytdl-core";
const CLIENT = new Client(),
	QUEUE = new Map();
import { readFileSync } from "fs";
import { createInterface } from "readline";
import pkg from "winston"; // logger
const { format: _FORMAT, createLogger, transports: _TRANSPORTS } = pkg;

let radiostation = JSON.parse(readFileSync("stations.json", "utf8")); // wczytanie stacji

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
		new _TRANSPORTS.File({ filename: "error.log", level: "error" }),
		new _TRANSPORTS.File({ filename: "bot.log" }),
		new _TRANSPORTS.Console(),
	],
	exceptionHandlers: [new _TRANSPORTS.File({ filename: "exceptions.log" })],
});

CLIENT.on("ready", () => {
	let botStatus = {
		id: 0,
		list: [
			"Zawołaj pomocy jak potrzebujesz 😉",
			`Jesem na ${CLIENT.guilds.cache.size} serwerach!`,
			"Ram pam pam",
			"🎶🎶🎶",
		],
	};

	setInterval(
		async () => (botStatus.list[1] = `Jesem na ${CLIENT.guilds.cache.size} serwerach!`),
		864e5
	); //co 24h

	setInterval(async () => {
		CLIENT.user.setPresence({
			// prezencja https://discord.js.org/#/docs/main/stable/typedef/PresenceData
			activity: {
				name: botStatus.list[botStatus.id],
				type: "PLAYING",
			},
			status: "online",
		});
		botStatus.id++;
		if (botStatus.id == botStatus.list.length) botStatus.id = 0;
	}, 6e5); // co 10 min

	logger.info(`Zalogowano jako ${CLIENT.user.tag}!`);
	logger.info(`Link z zaproszeniem: ${process.env.BOT_INVITE}`);
	CONSOLE.question("Wcisnij enter aby zakonczyc\n", () => {
		CLIENT.destroy();
		process.exit();
	});
});

CLIENT.on("message", async (message) => {
	if (message.author.bot) return;

	if (!message.channel.permissionsFor(message.client.user).has("SEND_MESSAGES"))
		return message.author.send("Mordo nie mogę pisać").catch((err) => logger.error(err));

	if (message.content.toLowerCase().includes("twoja stara"))
		return message.channel.send("zapierdala");

	if (
		!message.content.startsWith("<@" + CLIENT.user + ">") &&
		!message.content.startsWith("<@!" + CLIENT.user + ">")
	)
		return;

	const SERVERQUEUE = QUEUE.get(message.guild.id);
	const ARGS = message.content.replace(/\s+/g, " ").split(" ");
	const ADMINID = process.env.ADMIN.split(",");

	if (!ARGS[1]) return message.channel.send("czego kurwa");

	if (ARGS[1] == "odśwież")
		for (let i = 0; i < ADMINID.length; i++)
			if (message.author.id === ADMINID[i]) return refresh(message.channel);
	if (ARGS[1] == "stacje") return list_stations(message.channel);
	if (ARGS[1] == "pomocy")
		return message.channel.send(
			"```Dostępne polecenia:\n@Radio odpal < nazwa stacji > / <link z yt> - dołącza do kanału i odtwarza wybrane radio/film z linka\n@Radip queue - pokazuję aktualną kolejke \n@Radio idź - przestaje grać i wychodzi z kanału\n@Radio stacje - wyświetla dostępne stacje\n@Radio loop - zapętlanie utworów\n@Radio kloop - zapętla całą kolejkę \n@Radio pomiń - pomija element z kolejki```"
		);
	if (
		checkIfOnChannel(message.member.voice.channel, message.channel) &&
		checkIfOnSameVC(message.member.voice.channel, message.channel, SERVERQUEUE)
	) {
		if (ARGS[1] == "odpal") {
			const PERMISSIONS = message.member.voice.channel.permissionsFor(CLIENT.user);
			if (!PERMISSIONS.has("CONNECT") || !PERMISSIONS.has("SPEAK"))
				return message.channel.send("No bym wbił ale nie moge 😕");
			return execute(message, SERVERQUEUE, ARGS[2]);
		}
		if (ARGS[1] == "idź") {
			message.channel.send("okok");
			return stop_radio(SERVERQUEUE);
		}
		if (checkIfQueue(SERVERQUEUE, message.channel)) {
			if (ARGS[1] == "pomiń") return skip(SERVERQUEUE);
			if (ARGS[1] == "loop" || ARGS[1] == "kloop") return loop(message, SERVERQUEUE, ARGS[1]);
			if (ARGS[1] == "queue") return queue(message, SERVERQUEUE);
		} else return;
	} else return;
	return message.reply("nie wie jak korzystać z bota");
});
async function execute(message, queue, url) {
	const MEDIAINFO = {
		url: null,
		name: null,
		yt: false,
	};

	if (url.includes("youtu.be") || url.includes("youtube.com")) {
		try {
			const ytinfo = await ytdl.getInfo(url);
			MEDIAINFO.url = url;
			MEDIAINFO.name = ytinfo.videoDetails.title;
			MEDIAINFO.yt = true;
		} catch (err) {
			logger.info(err);
			return message.channel.send("Nie ma takiego filmu");
		}
	} else {
		const STATIONNR = findStation(url);
		if (STATIONNR == -1) return message.channel.send("O ch*j ci chodzi?");
		const STATIONINFO = radiostation.stations[STATIONNR];
		MEDIAINFO.url = STATIONINFO.url;
		MEDIAINFO.name = STATIONINFO.desc;
		MEDIAINFO.yt = false;
	}

	if (!queue) {
		const MEDIACONSTRUCT = {
			textChannel: message.channel,
			voiceChannel: message.member.voice.channel,
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
			let connection = await message.member.voice.channel.join();
			logger.info(`Polaczono z kanalem ${message.member.voice.channel.name}!`);
			MEDIACONSTRUCT.connection = connection;
			play(message.guild);
			connection.on("disconnect", () => {
				QUEUE.delete(message.guild.id);
				logger.info(`Rozlaczono z kanalem ${message.member.voice.channel.name}!`);
			});
		} catch (err) {
			logger.error(err);
			QUEUE.delete(message.guild.id);
			return;
		}
	} else {
		queue.media.push(MEDIAINFO);
		message.channel.send(`${MEDIAINFO.name} dodano do kolejki!`);
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
function skip(queue) {
	if (queue.loop) queue.media.shift();
	queue.connection.dispatcher.end();
}
function play(guild) {
	const SERVERQUEUE = QUEUE.get(guild.id);
	if (!SERVERQUEUE.media[0]) return SERVERQUEUE.voiceChannel.leave();
	let dispatcher;
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
	if (SERVERQUEUE.lastName != SERVERQUEUE.media[0].name) {
		SERVERQUEUE.textChannel.send(`Właśnie leci: **${SERVERQUEUE.media[0].name}**`);
		SERVERQUEUE.lastName = SERVERQUEUE.media[0].name;
	}
}
function loop(message, queue, loopMode) {
	let text = "Powtarzanie ";
	if (loopMode === "loop") {
		queue.kloop = false;
		queue.loop = !queue.loop;
	} else {
		queue.loop = false;
		queue.kloop = !queue.kloop;
		text = text.concat("kolejki ");
	}
	if (queue.loop == queue.kloop) message.channel.send(text.concat("wyłączone"));
	else message.channel.send(text.concat("włączone"));
}

function findStation(searchWord) {
	let i = 0;
	while (radiostation.stations[i]) {
		if (radiostation.stations[i].shortname === searchWord) return i;
		i++;
	}
	return -1;
}
function stop_radio(queue) {
	queue.media = [];
	queue.connection.dispatcher.end();
}
function queue(message, queue) {
	let text = "```";
	text = text.concat(`Kolejka:\nWłaśnie leci:${queue.media[0].name}\n`);
	for (let i = 1; i < queue.media.length; i++)
		text = text.concat(`${i}. ${queue.media[i].name}\n`);
	message.channel.send(text.concat("```"));
}

/*CLIENT.on("voiceStateUpdate", (oldMember) => {
	const SERVERQUEUE = QUEUE.get(oldMember.guild.id);
	if (SERVERQUEUE.voiceChannel.members.size === 1) stop_radio(SERVERQUEUE);
});*/

function list_stations(channel) {
	let i = 0,
		msg = "```Dostępne stacje:";
	while (radiostation.stations[i]) {
		msg.concat(`\n${radiostation.stations[i].shortname} - ${radiostation.stations[i].desc}`);
		i++;
	}
	channel.send(msg.concat("````"));
}

function refresh(channel) {
	radiostation = JSON.parse(readFileSync("stations.json"));
	channel.send("Odświeżam");
}

CLIENT.on("error", (error) => logger.error(error));

CLIENT.login(process.env.BOT_TOKEN);
