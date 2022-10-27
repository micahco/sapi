declare var CONFIG: any;

interface ItemJSON {
	artists: [{name: string}];
	id: string;
	name: string;
	type: string;
	uri: string;
}

export default class AppContainer extends HTMLElement {
	searchElement!: HTMLInputElement;
	searchTypeElement!: HTMLFieldSetElement;
	searchResultsElement!: HTMLUListElement;
	getPlaylistButton!: HTMLButtonElement;
	danceability!: HTMLInputElement;
	energy!: HTMLInputElement;
	popularity!: HTMLInputElement;
	valence!: HTMLInputElement;
	seedsElement!: {
		[type: string]: HTMLUListElement
	};
	playlistElement!: HTMLDivElement;
	playlistOrdered!: HTMLOListElement;
	savePlaylistButton!: HTMLButtonElement;
	clearPlaylistButton!: HTMLButtonElement;
	resultsElement!: HTMLDivElement;

	connectedCallback() {
		const shadowRoot = this.attachShadow({ mode: 'open' });
		const app = document.getElementById('app-template') as HTMLTemplateElement;
		shadowRoot.appendChild(app.content.cloneNode(true));
		// initialize elements
		this.searchElement = shadowRoot.getElementById('search') as HTMLInputElement;
		this.searchTypeElement = shadowRoot.getElementById('search-method') as HTMLFieldSetElement;
		this.searchResultsElement = shadowRoot.getElementById('search-results') as HTMLUListElement;
		this.getPlaylistButton = shadowRoot.getElementById('get-playlist') as HTMLButtonElement;
		this.danceability = shadowRoot.getElementById('danceability') as HTMLInputElement;
		this.energy = shadowRoot.getElementById('energy') as HTMLInputElement;
		this.popularity = shadowRoot.getElementById('popularity') as HTMLInputElement;
		this.valence = shadowRoot.getElementById('valence') as HTMLInputElement;
		this.seedsElement = {
			artist: shadowRoot.getElementById('artist-seeds') as HTMLUListElement,
			track: shadowRoot.getElementById('track-seeds') as HTMLUListElement
		};
		this.playlistElement = shadowRoot.getElementById('playlist') as HTMLDivElement;
		this.playlistOrdered = shadowRoot.getElementById('playlist-ordered') as HTMLOListElement;
		this.savePlaylistButton = shadowRoot.getElementById('save-playlist') as HTMLButtonElement;
		this.clearPlaylistButton = shadowRoot.getElementById('clear-playlist') as HTMLButtonElement;
		this.resultsElement = shadowRoot.getElementById('results') as HTMLDivElement;
		// event listeners
		this.searchElement.addEventListener('keyup', this.handleSearchKeyup.bind(this));
		this.searchElement.addEventListener('search', this.handleSearchEvent.bind(this));
		this.searchTypeElement.addEventListener('change', this.searchQuery.bind(this));
		this.getPlaylistButton.addEventListener('click', this.handleGetPlaylistButtonClick.bind(this));
		this.clearPlaylistButton.addEventListener('click', this.clearPlaylist.bind(this));
	}

	private handleSearchKeyup(e: KeyboardEvent) {
		if (!this.searchElement.value) {
			this.clearResults();
		}
		if (e.key === 'Enter') {
			this.searchQuery();
		}
	}

	private handleSearchEvent(e: Event) {
		if (!this.searchElement.value) {
			this.clearResults();
		}
	}

	private handleGetPlaylistButtonClick(e: MouseEvent) {
		if(!this.hasSeeds()) {
			return console.error('The button abides')
		}
		this.clearResults();
		this.getPlaylist();
	}

	private async searchQuery() {
		const query = this.searchElement.value;
		if (!query || query.length < 1) return;
		const type = this.searchTypeElement.querySelector('input[type="radio"]:checked')!.parentElement?.textContent;
		if (type != 'artist' && type != 'track') {
			return console.error('invalid type');
		}
		const url = `${CONFIG.apiURL}/search?q=${query}&type=${type}`;
		try {
			const response = await fetch(url, {
				method: "GET",
				credentials: "include"
			});
			const json = await response.json();
			const results: ItemJSON[] = json[type+'s']['items'];
			this.showResults(results);
		} catch (error) {
			console.error(error);
		}
	}

	private showResults(results: ItemJSON[]) {
		this.searchResultsElement?.replaceChildren();
		results.forEach(result => {
			const item = document.createElement('li');
			let textContent = result.name;
			if (result.type == 'track') {
				textContent = result.artists[0].name + ' - ' + textContent;
			}
			item.textContent = textContent;
			item.dataset.id = result.id;
			item.dataset.type = result.type;
			item.addEventListener('click', this.addItemToSeeds.bind(this));
			this.searchResultsElement?.appendChild(item);
		});
	}

	private clearResults() {
		this.searchResultsElement.replaceChildren();
	}

	private addItemToSeeds(e: MouseEvent) {
		const searchResult = e.target as HTMLElement;
		const seeds = this.seedsElement[searchResult.dataset.type!];
		const seedItems = seeds?.querySelectorAll('li');
		let isNewItem = true;
		if (seedItems != null) {
			if (seedItems!.length >= 5) {
				alert('Max of 5 items per seed');
				return;
			}
			seedItems?.forEach(li => {
				if (li.dataset.id == searchResult.dataset.id) {
					isNewItem = false;
					return;
				}
			});
		}
		if (isNewItem) {
			const item = document.createElement('li');
			item.textContent = searchResult.textContent;
			item.dataset.id = searchResult.dataset.id;
			item.addEventListener('click', this.deleteItemFromSeeds.bind(this));
			seeds?.appendChild(item);
		}
		this.checkButton();
	}

	private deleteItemFromSeeds(e: MouseEvent) {
		const item = e.target as HTMLElement;
		item.remove();
		this.checkButton();
	}

	private hasSeeds(): boolean {
		const artists = this.shadowRoot?.getElementById('artist-seeds')?.hasChildNodes() || false;
		const tracks = this.shadowRoot?.getElementById('track-seeds')?.hasChildNodes() || false;
		return artists || tracks;
	}

	private checkButton() {
		const btn = this.shadowRoot?.getElementById('get-playlist') as HTMLButtonElement;
		if (this.hasSeeds()) {
			btn.disabled = false;
		} else {
			btn.disabled = true;
		}
	}

	private getSeeds(type: string): string[] {
		const el = this.shadowRoot?.getElementById(type + '-seeds');
		if (!el?.hasChildNodes) {
			return [];
		}
		const children = el?.querySelectorAll('li');
		const len = children?.length;
		const seeds: string[] = [];
		for (let i = 0; i < len; i++) {
			const id = children[i].dataset.id;
			if (id != null) {
				seeds.push(id);
			}
		}
		return seeds;
	}

	private async getPlaylist() {
		const seedArtists = this.getSeeds('artist').join(',');
		const seedTracks = this.getSeeds('track').join(',');
		let url = `${CONFIG.apiURL}/rec
			?seed_artists=${seedArtists}
			&seed_tracks=${seedTracks}
			&target_danceability=${this.danceability.value}
			&target_energy=${this.energy.value}
			&target_popularity=${this.popularity.value}
			&target_valence=${this.valence.value}
		`;
		const response = await fetch(url, {
			method: "GET",
			credentials: "include"
		});
		const json = await response.json();
		const tracks = json['tracks'] as ItemJSON[];
		this.addTracksToPlaylist(tracks);
	}

	private addTracksToPlaylist(tracks: ItemJSON[]) {
		this.playlistOrdered.replaceChildren();
		const trackURIs: string[] = [];
		tracks.forEach(track => {
			const item = document.createElement('li');
			item.textContent = track.artists[0].name + ' - ' + track.name;
			trackURIs.push(track.uri);
			this.playlistOrdered.appendChild(item);
		});
		this.playlistElement.hidden = false;
		this.savePlaylistButton.addEventListener('click', (e) => {
			this.addPlaylistToUserLibray(trackURIs);
		})
		this.savePlaylistButton.classList.remove('hidden');
		this.playlistElement.classList.remove('hidden');
	}

	private async addPlaylistToUserLibray(trackURIs: string[]) {
		const body =  {uris: [] as string[]};
		body.uris = trackURIs;
		const response = await fetch(CONFIG.apiURL + '/playlist', {
			method: "POST",
			credentials: "include",
			body: JSON.stringify(body),
			headers: new Headers({
				'Content-Type': 'application/json'
			})
		});
		const json: {id: string, username: string} = await response.json();
		const link = document.createElement('a');
		link.href = `https://open.spotify.com/user/${json.username}/playlist/${json.id}`;
		link.target = '_blank';
		link.textContent = link.href;
		this.resultsElement.replaceChildren(link);
		this.clearPlaylist();
	}
	private clearPlaylist() {
		this.playlistOrdered.replaceChildren();
		this.playlistElement.classList.add('hidden');
	}
}