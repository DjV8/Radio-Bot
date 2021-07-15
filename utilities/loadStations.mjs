import { readFileSync } from 'fs';

const stationsLoad = () => JSON.parse(readFileSync('stations.json'));

export default stationsLoad;
