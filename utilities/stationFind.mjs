import stationsLoad from './stationsLoad.mjs';

function stationFind(stationName) {
	const { stations } = stationsLoad();
	for (const station of stations)
		if (station.shortname == stationName) return station;
	return false;
}

export default stationFind;
