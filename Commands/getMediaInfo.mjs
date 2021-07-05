import logger from '../utilities/logger.mjs';
import ytdl from 'ytdl-core';

import stationFind from '../utilities/stationFind.mjs';

const getMediaInfo = async (link) => {
	class getInfo {
		constructor(url, title, type) {
			this.url = url;
			this.name = title;
			this.type = type;
		}
	}
	if (link.includes('youtube.com') || link.includes('youtu.be'))
		try {
			const ytinfo = await ytdl.getInfo(link);
			return new getInfo(link, ytinfo.videoDetails.title, `yt`);
		} catch (err) {
			logger.info(err);
			return 'Nie ma takiego filmu';
		}
	else if (link.includes('.mp3'))
		try {
			return new getInfo(`./Music/${link}`, link, `mp3`);
		} catch {
			return 'Nie ma takiego pliku';
		}
	else {
		const stationInfo = stationFind(link);
		if (!stationInfo) return 'Nie wiem co masz na myśli';
		return new getInfo(stationInfo.url, stationInfo.desc, `radio`);
	}
};

export default getMediaInfo;
