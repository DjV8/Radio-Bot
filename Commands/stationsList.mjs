import stationsLoad from '../utilities/loadStations.mjs';

const stationsList = () =>
  `\`\`\`Dostępne stacje: ${stationsLoad().stations.map(
    ({ shortname, desc }) => `\n${shortname} - ${desc}`
  )}\`\`\``;

export default stationsList;
