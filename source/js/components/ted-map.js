import { WorkerDispatcher } from "../lib/worker-dispatcher.js";
import { loadMap } from "../lib/ted-asset.js";
import { imageToCanvas } from "../lib/image-utils.js";

const renderDispatcher = new WorkerDispatcher(new Worker("./js/workers/render-worker.js", { type: "module" }));

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
		element.renderGrid = element.renderGrid.bind(element);
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
					:host { display: grid; }
					#table-container { grid-row: 1 / 1; grid-column: 1 / 1; }
					#canvas-container { grid-row: 1 / 1; grid-column: 1 / 1; }
					table { border-spacing: 0px; }
					td { padding: 0px; width: 64px; height: 64px; }
				</style>
				<div id="canvas-container"></div>
				<div id="table-container"></div>
			`;
	}
	cacheDom() {
		this.dom = {
			tableContainer: this.shadowRoot.querySelector("#table-container"),
			canvasContainer: this.shadowRoot.querySelector("#canvas-container")
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
	async renderMap() {
		const start = performance.now();
		const map = await renderDispatcher.dispatch("renderTedMap", [loadMap(this.map, this.walls.length), this.walls, this.pallet]);
		const canvas = imageToCanvas(map);
		this.dom.canvasContainer.appendChild(canvas);
		this.renderGrid();
		const end = performance.now();
		console.log(`Rendered map in: ${end - start}ms`);
	}
	renderGrid(){
		const table = document.createElement("table");

		for(let row = 0; row < this.map[0].length; row++){
			const tr = document.createElement("tr");

			for(let col = 0; col < this.map[0][0].length; col++){
				const td = document.createElement("td");
				td.dataset.x = col;
				td.dataset.y = row;

				tr.appendChild(td);
			}

			table.appendChild(tr);
		}
		this.dom.tableContainer.appendChild(table);
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("ted-map", TedMap);
