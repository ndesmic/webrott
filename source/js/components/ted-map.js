import { renderTableMap } from "../lib/image-utils.js";

export class TedMap extends HTMLElement {
	static get observedAttributes() {
		return [];
	}
	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.cacheDom = element.cacheDom.bind(element);
		element.render = element.render.bind(element);
		element.setMap = element.setMap.bind(element);
		element.renderMap = element.renderMap.bind(element);
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.renderMap();
	}
	render() {
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="css/system.css">
				<style>
					table { border-spacing: 0px; }
					td { padding: 0px; }
					td canvas { display: block; }
				</style>
				<div id="table-container"></div>
			`;
	}
	cacheDom() {
		this.dom = {
			tableContainer: this.shadowRoot.querySelector("#table-container"),
		};
	}
	setMap(map) {
		this.map = map;
	}
	setWallBitmaps(walls){
		this.walls = walls; 
	}
	setPallet(pallet){
		this.pallet = pallet;
	}
	renderMap() {
		const table = renderTableMap(this.map, this.walls, this.pallet);
		this.dom.tableContainer.appendChild(table);
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("wolf-map", TedMap);
