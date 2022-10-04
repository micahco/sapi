export default class LinkButton extends HTMLElement {
	connectedCallback() {
		const btn = document.createElement('button');
		btn.type = 'button';
		btn.textContent = this.textContent;
		btn.addEventListener('click', this.handleButtonClick.bind(this));
		this.replaceChildren(btn);
	}

	private handleButtonClick(): void {
		location.href = this.dataset.href || '#';
	}
}