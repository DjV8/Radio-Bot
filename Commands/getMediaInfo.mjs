class getInfo {
  constructor(url, title, type) {
    this.url = url;
    this.name = title;
    this.type = type;
  }
}

const getMediaInfo = async (link) =>
  link.includes('youtube.com') || link.includes('youtu.be')
    ? await ytInfo(link)
    : link.includes('.mp3')
    ? mp3Info(link)
    : await stationInfo(link);

const ytInfo = async (link) => {
  try {
    const { default: ytdl } = await import('ytdl-core');
    const ytinfo = await ytdl.getInfo(link);
    return new getInfo(link, ytinfo.videoDetails.title, `yt`);
  } catch (err) {
    const { default: logger } = await import('../utilities/logger.mjs');
    logger.info(err);
    return 'Nie ma takiego filmu';
  }
};

const mp3Info = (link) => {
  try {
    return new getInfo(`./Music/${link}`, link, `mp3`);
  } catch {
    return 'Nie ma takiego pliku';
  }
};

const stationInfo = async (link) => {
  const { default: findStation } = await import('../utilities/findStation.mjs');
  const stationInfo = findStation(link);
  return stationInfo
    ? new getInfo(stationInfo.url, stationInfo.desc, `radio`)
    : 'Nie wiem co masz na myśli';
};

export default getMediaInfo;
