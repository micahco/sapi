import development from '../config.json'
import production from '../config.prod.json'
declare var PRODUCTION: boolean;

interface Config {
	apiURL: string,
	appURL: string,
	redirectURI: string
}

export default function getConfig(): Config {
	if (PRODUCTION) {
		return production;
	}
	return development;
};