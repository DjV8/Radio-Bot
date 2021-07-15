import stationsLoad from './loadStations.mjs';

const stationFind = (stationName) =>
	stationsLoad().stations.find(({ shortname }) => shortname === stationName);

export default stationFind;
