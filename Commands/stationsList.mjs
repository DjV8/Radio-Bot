import stationsLoad from '../utilities/stationsLoad.mjs';

const stationsList = () => {
	const { stations } = stationsLoad();
	let stationsList = '```Dostępne stacje:';
	stations.forEach((station) => {
		stationsList += `\n${station.shortname} - ${station.desc}`;
	});

	return (stationsList += '```');
};

export default stationsList;
