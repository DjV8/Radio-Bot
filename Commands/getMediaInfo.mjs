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
			const { default: ytdl } = await import('ytdl-core');
			const ytinfo = await ytdl.getInfo(link);
			return new getInfo(link, ytinfo.videoDetails.title, `yt`);
		} catch (err) {
			const { default: logger } = await import('../utilities/logger.mjs');
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
		const { default: stationFind } = await import(
			'../utilities/stationFind.mjs'
		);
		const stationInfo = stationFind(link);
		return stationInfo
			? new getInfo(stationInfo.url, stationInfo.desc, `radio`)
			: 'Nie wiem co masz na myśli';
	}
};

export default getMediaInfo;
