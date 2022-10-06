import { getConfig } from './config';
import AppContainer from './components/AppContainer';
import LinkButton from './components/LinkButton';

(async () => {
	// customElements definitions
	window.customElements.define('app-container', AppContainer);
	window.customElements.define('link-button', LinkButton);

	const root = document.getElementById('app')!;
	try {
		const response = await fetch(getConfig().apiURL + '/auth', {
			method: "GET",
			credentials: "include"
		});
		const header = document.querySelector('header')!;
		if (response.ok) {
			header.innerHTML += `<link-button data-href='${getConfig().apiURL}/auth/logout'>Logout</link-button>`;
			const ac = document.createElement('app-container');
			root.appendChild(ac);
		} else {
			header.innerHTML += `<link-button data-href='${getConfig().apiURL}/auth/login'>Login with Spotify</link-button>`;
		}
	} catch(error) {
		console.error(error);
		let msg = 'Something went wrong...'
		if (error == 'TypeError: Failed to fetch') {
			msg = 'Unable to fetch server :('
		}
		console.log(msg)
	}
})();