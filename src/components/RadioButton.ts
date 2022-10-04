export default class RadioButton extends HTMLElement {
	connectedCallback() {
		const input = document.createElement("input");
		input.type = "radio";
		input.name = "search-method";
		input.id = this.textContent || '';
		input.checked = this.hasAttribute('data-checked') ? true : false;
		const label = document.createElement("label");
		label.textContent = this.textContent;
		label.appendChild(input);
		this.replaceChildren(label);
	}
}