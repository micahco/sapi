import getConfig from '../config';

interface ItemJSON {
	artists: [{name: string}];
	id: string;
	name: string;
	type: string;
}

export default class AppContainer extends HTMLElement {
	connectedCallback() {
		const shadowRoot = this.attachShadow({ mode: 'open' });
		const style = document.getElementById('style') as HTMLTemplateElement;
		shadowRoot.appendChild(style.content.cloneNode(true));

		const flex = document.createElement('div');
		flex.className = 'flex-wrap';

		// search
		const search = document.createElement('div');
		search.id = 'search';
		const searchBar = document.createElement('div');
		searchBar.id = 'search-bar';
		const input = document.createElement('input');
		input.type = 'search';
		input.placeholder = 'search';
		input.addEventListener('keyup', this.handleInputKeyUp.bind(this));
		input.addEventListener('search', this.handleInputSearch.bind(this));
		searchBar.appendChild(input);
		// radio input
		const templateFieldset = document.getElementById('template-fieldset') as HTMLTemplateElement;
		searchBar.appendChild(templateFieldset.content.cloneNode(true));
		const fieldset = searchBar.querySelector('fieldset');
		fieldset?.addEventListener('change', this.handleRadioChange.bind(this));
		search.appendChild(searchBar);
		// search results
		const searchResults = document.createElement('ul');
		searchResults.id = 'search-results';
		search.appendChild(searchResults);
		flex.appendChild(search);

		// seeds
		const seeds = document.createElement('div');
		seeds.id = 'seeds';
		const artistSeeds = document.createElement('ul');
		artistSeeds.id = 'artist-seeds';
		const trackSeeds = document.createElement('ul');
		trackSeeds.id = 'track-seeds';
		seeds.append(artistSeeds, trackSeeds);
		// button
		const button = document.createElement('button');
		button.id = 'execute';
		button.type = 'button';
		button.textContent = 'Create Playlist';
		button.disabled = true;
		button.addEventListener('click', this.handleButtonClick.bind(this));
		seeds.appendChild(button);
		
		flex.appendChild(seeds);
		shadowRoot.appendChild(flex);
	}

	private handleInputKeyUp(e: KeyboardEvent) {
		const input = e.target as HTMLInputElement;
		if (!input.value) {
			this.clearResults();
		}
		if (e.key === 'Enter') {
			this.search();
		}
	}

	private handleInputSearch(e: Event) {
		const input = e.target as HTMLInputElement;
		if (!input.value) {
			this.clearResults();
		}
	}

	private handleRadioChange(e: Event) {
		this.search();
	}

	private handleButtonClick(e: MouseEvent) {
		if(!this.hasSeeds()) {
			return console.error('The button abides')
		}
		this.execute();
	}

	private async search() {
		const query = this.shadowRoot!.querySelector('input')!.value;
		if (!query || query.length < 1) return;
		const type = this.shadowRoot!.querySelector('input[type="radio"]:checked')!.id;
		if (type != 'artist' && type != 'track') {
			return console.error('invalid type');
		}
		const url = `${getConfig().apiURL}/search?q=${query}&type=${type}`;
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
		const searchResults = this.shadowRoot?.getElementById('search-results');
		searchResults?.replaceChildren();
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
			searchResults?.appendChild(item);
		});
	}

	private clearResults() {
		const searchResults = this.shadowRoot?.getElementById('search-results');
		searchResults?.replaceChildren();
	}

	private addItemToSeeds(e: MouseEvent) {
		const searchResult = e.target as HTMLElement;
		const seeds = this.shadowRoot?.getElementById(searchResult.dataset.type + '-seeds');
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
		const btn = this.shadowRoot?.getElementById('execute') as HTMLButtonElement;
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

	private async execute() {
		const artists = this.getSeeds('artist').join(',');
		const tracks = this.getSeeds('track').join(',');
		let url = `${getConfig().apiURL}/rec?seed_artists=${artists}&seed_tracks=${tracks}`;
		console.log(url)
	}
}