import { WorkerDispatcher } from "../lib/worker-dispatcher.js";
import { imageToCanvas } from "../lib/image-utils.js";

const baseUrl = new URL(import.meta.url);
const baseSplit = baseUrl.pathname.split("/");
const basePath = `${baseSplit.slice(0, -2).join("/")}/`; //get parent path

const renderDispatcher = new WorkerDispatcher(new Worker(basePath + "workers/render-worker.js", { type: "module" }));

export class WcTileMap extends HTMLElement {
	#map;
	#tiles;
	#transforms;
	#pallet;
	#tileSize;

	#rendered = false;

	static observedAttributes = [
		"map",
		"tiles",
		"transforms",
		"pallet",
		"tile-size"
	];
	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.cacheDom = element.cacheDom.bind(element);
		element.render = element.render.bind(element);
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
					:host { display: grid; }
					#table-container { z-index: 1; grid-row: 1; grid-column: 1; }
					#canvas-container { z-index: 0; grid-row: 1; grid-column: 1; }
					wc-pan-box { grid-row: 1 / 1; grid-column: 1 / 1; block-size: 100%; inline-size: 100%; overflow: auto;  }
					table { border-spacing: 0px; }
					td { padding: 0px; width: 64px; height: 64px; min-width: 64px; min-height: 64px; text-align: center; }
					canvas { image-rendering: pixelated; width: 100%; height: 100%; }
				</style>
				<div id="canvas-container"></div>
				<div id="table-container"></div>
			`;
		this.#rendered = true;
	}
	cacheDom() {
		this.dom = {
			viewPort: this.shadowRoot.querySelector("#viewport"),
			tableContainer: this.shadowRoot.querySelector("#table-container"),
			canvasContainer: this.shadowRoot.querySelector("#canvas-container")
		};
	}
	setCenter(){
	}
	//2d array indicies
	set map(map) {
		this.#map = map;
		this.renderMap();
	}
	//1d array of bitmaps
	set tiles(tiles){
		this.#tiles = tiles;
		this.renderMap();
	}
	//2d array of int 0-3
	set transforms(transforms){
		this.#transforms = transforms;
		this.renderMap();
	}
	set pallet(pallet){
		this.#pallet = pallet;
		this.renderMap();
	}
	set ["tile-size"](tileSize){
		this.#tileSize = tileSize;
		this.renderMap();
	}
	async renderMap() {
		if(!this.#rendered) return;
		const start = performance.now();
		if(this.#tiles && this.#map && this.#pallet && this.#tileSize){
			const map = await renderDispatcher.dispatch("renderTileMap", [this.#map, this.#tiles, this.#transforms, this.#pallet, this.#tileSize]);
			const canvas = imageToCanvas(map);
			this.dom.canvasContainer.appendChild(canvas);
		}

		if(this.#map){
			const table = renderGrid(this.#map, !this.#tiles);
			this.dom.tableContainer.appendChild(table);
		}
		const end = performance.now();
		console.log(`Rendered map in: ${end - start}ms`);
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = JSON.parse(newValue);
	}
}

customElements.define("wc-tile-map", WcTileMap);

function renderGrid(map, isSkeleton = false){
	const table = document.createElement("table");

	for (let row = 0; row < map.length; row++) {
		const tr = document.createElement("tr");

		for (let col = 0; col < map[0].length; col++) {
			const td = document.createElement("td");
			const value = map[row][col];
			td.dataset.x = col;
			td.dataset.y = row;
			td.dataset.value = value;
			if(isSkeleton){
				if(value && value < 89){
					td.style.backgroundColor = "#000";
					td.style.color = "#fff";
					td.textContent = value;
				}
			}

			tr.appendChild(td);
		}

		table.appendChild(tr);
	}
	return table;
}