import stationFind from './findStation.mjs';
import ytpl from 'ytpl';
import ytdl from 'ytdl-core';
import { existsSync } from 'fs';

class playerInfo {
  constructor(url, title, type) {
    this.url = url;
    this.title = title;
    this.source = type;
  }
}

const getMediaInfo = async (url) => {
  try {
    return url.includes('youtube.com') || url.includes('youtu.be')
      ? url.includes('list=')
        ? await ytPlaylist(url)
        : await ytInfo(url)
      : url.includes('.mp3')
      ? mp3Info(url)
      : stationInfo(url);
  } catch (error) {
    throw error;
  }
};

const ytInfo = async (url) => {
  try {
    const ytinfo = await ytdl.getInfo(url);
    return new playerInfo(url, ytinfo.videoDetails.title, `yt`);
  } catch (err) {
    throw err.message;
  }
};

const ytPlaylist = async (url) => {
  try {
    const playlist = await ytpl(url, { pages: 1 });
    return playlist.items.map(
      ({ url, title }) => new playerInfo(url, title, `yt`)
    );
  } catch (err) {
    throw err.message;
  }
};

const mp3Info = (url) => {
  const path = `./Music/${url}`;
  if (existsSync(path)) return new playerInfo(path, url, `local`);
  throw 'Nie ma takiego pliku';
};

const stationInfo = (url) => {
  const stationInfo = stationFind(url);
  if (stationInfo)
    return new playerInfo(stationInfo.url, stationInfo.desc, `radio`);
  throw 'Nie wiem co masz na myśli';
};

export default getMediaInfo;
