import logger from './logger.mjs';
import stationFind from './findStation.mjs';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core';
import { existsSync } from 'fs';

class playerInfo {
	constructor(url, title, type) {
		this.url = url;
		this.title = title;
		this.type = type;
	}
}

const getMediaInfo = async (url) =>
	url.includes('youtube.com') || url.includes('youtu.be')
		? url.includes('list=')
			? await ytPlaylist(url)
			: await ytInfo(url)
		: url.includes('.mp3')
		? mp3Info(url)
		: stationInfo(url);

const ytInfo = async (url) => {
	try {
		const ytinfo = await ytdl.getInfo(url);
		return new playerInfo(url, ytinfo.videoDetails.title, `yt`);
	} catch (err) {
		logger.info(err);
		return 'Nie ma takiego filmu';
	}
};

const ytPlaylist = async (url) => {
	try {
		const playlist = await ytpl(url, { pages: 1 });
		return playlist.items.map(({ url, title }) => new playerInfo(url, title, `yt`));
	} catch (err) {
		logger.info(err);
		return 'Nie ma takiej playlisty';
	}
};

const mp3Info = (url) => {
	const path = `./Music/${url}`;
	try {
		if (existsSync(path)) return new playerInfo(path, url, `mp3`);
		else return 'Nie ma takiego pliku';
	} catch (err) {
		logger.info(err);
	}
};

const stationInfo = (url) => {
	const stationInfo = stationFind(url);
	return stationInfo
		? new playerInfo(stationInfo.url, stationInfo.desc, `radio`)
		: 'Nie wiem co masz na myśli';
};

export default getMediaInfo;
