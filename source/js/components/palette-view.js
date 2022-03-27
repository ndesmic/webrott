export class PaletteView extends HTMLElement {
	#palettes;

	static get observedAttributes() {
		return ["palettes"];
	}
	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.cacheDom = element.cacheDom.bind(element);
		element.render = element.render.bind(element);
		element.renderPalettes = element.renderPalettes.bind(element);
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.renderPalettes();
	}
	render() {
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
				<style>
					#palettes { list-style: none; }
					#palettes td { inline-size: 32px; block-size: 32px; }
				</style>
				<ul id="palettes"></ul>
			`;
	}
	cacheDom() {
		this.dom = {
			palettes: this.shadowRoot.querySelector("#palettes"),
		};
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
	set palettes(value){
		if(typeof(value) === "string"){
			value = JSON.parse(value);
		}
		this.#palettes = value;
		this.renderPalettes();
	}
	renderPalettes() {
		if(!this.dom?.palettes) return;
		this.dom.palettes.innerHTML = "";
		for (let map = 0; map < this.#palettes.length; map++) {
			const table = document.createElement("table");
			table.classList.add("palette");
			const li = document.createElement("li");
			const h2 = document.createElement("h2");
			h2.textContent = `palette ${map}`;

			for (let row = 0; row < 16; row++) {
				const tableRow = document.createElement("tr");

				for (let col = 0; col < 16; col++) {
					const tableCell = document.createElement("td");

					const red = this.#palettes[map][row * 16 + col][0];
					const green = this.#palettes[map][row * 16 + col][1];
					const blue = this.#palettes[map][row * 16 + col][2];

					tableCell.style.backgroundColor = `rgb(${red},${green},${blue})`;
					tableCell.style.width = `16px`;
					tableCell.style.height = `16px`;
					tableRow.appendChild(tableCell);
				}
				table.appendChild(tableRow);
			}
			li.appendChild(h2)
			li.appendChild(table);
			this.dom.palettes.append(li);
		}
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("palette-view", PaletteView);
