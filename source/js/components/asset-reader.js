import { readFile, getExtension, getName } from "../lib/file-utils.js";
import "./tab-set.js";

const tedMapNames = ["gamemaps", "maptemp"];
const tedMapHeaderNames = ["mapthead", "maphead"];

function renderCell(text){
	const td = document.createElement("td");
	td.textContent = text;
	return td;
}

function renderEntry(file, fileType, entry, index, loader){
	const tr = document.createElement("tr");

	tr.appendChild(renderCell(index));

	switch (fileType) {
		case "wad": {
			tr.appendChild(renderCell(entry.name));
			tr.appendChild(renderCell(entry.offset));
			tr.appendChild(renderCell(entry.size));
			tr.addEventListener("click", () => loader(file, "wad", entry.name));
			break;
		}
		case "vswap": {
			tr.appendChild(renderCell(entry.type));
			tr.appendChild(renderCell(entry.offset));
			tr.appendChild(renderCell(entry.size));
			tr.addEventListener("click", () => loader(file, "vswap", index, entry.type));
			break;
		}
		case "rtl": {
			tr.appendChild(renderCell(entry.name));
			tr.addEventListener("click", () => loader(file, "rtl", index));
			break;
		}
		case "gamemaps": {
			tr.appendChild(renderCell(entry.name));
			tr.addEventListener("click", () => loader(file, "wolf-map", index));
			break;
		}
	}

	return tr;
}

export class AssetReader extends HTMLElement {
	static get observedAttributes() {
		return [];
	}
	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.attachEvents = element.attachEvents.bind(element);
		element.cacheDom = element.cacheDom.bind(element);
		element.render = element.render.bind(element);
		element.onFileSelected = element.onFileSelected.bind(element);
		element.loadAsset = element.loadAsset.bind(element);
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.attachEvents();
	}
	render() {
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="./css/system.css">
				<style>
					:host{ display: grid; grid-template-columns: 50% 50%; grid-template-rows: 45px minmax(0, calc(100% - 45px)); height: 100%; grid-template-areas: "input input" "list preview"; }
					#tabs { overflow-y: auto; }
					#entries-container { grid-area: list; }
					#preview { grid-area: preview; overflow-y: auto; }
					#preview canvas { image-rendering: pixelated;  }
					#input { grid-area: input; }
					#entries tr, #maps tr { cursor: pointer; }

					#preview .pallet td { width: 32px; height: 32px; }
				</style>
				<div id="input">
					<label for="assets">Select WAD or VSWAP:</label>
					<input id="assets" type="file" multiple />
				</div>
				<tab-set id="tabs">
					<div slot="tabs">Content</div>
					<div id="entries-container" slot="panels">
						<table id="entries"></table>
					</div>
					<div slot="tabs">Maps</div>
					<div id="maps-container" slot="panels">
						<table id="maps"></table>
					</div>
				</tab-set>
				<div id="preview"></div>
			`;
	}
	cacheDom() {
		this.dom = {
			assets: this.shadowRoot.querySelector("#assets"),
			entries: this.shadowRoot.querySelector("#entries"),
			preview: this.shadowRoot.querySelector("#preview"),
			tabs: this.shadowRoot.querySelector("#tabs"),
			maps: this.shadowRoot.querySelector("#maps")
		};
	}
	async onFileSelected(e) {
		this.dom.entries.innerHTML = "";
		const files = Array.from(e.target.files);
		this.files = new Map();

		for (let file of files) {
			const extension = getExtension(file.name);
			const name = getName(file.name);
			const arrayBuffer = await readFile(file);

			if (tedMapHeaderNames.includes(name)) continue;  //not useful on it's own, read with other files

			const frag = document.createDocumentFragment();

			if (extension === "wad") {
				const { Wad } = await import("../lib/wad.js");
				const wadFile = new Wad(arrayBuffer);
				this.files.set("wad", wadFile);
				wadFile.entries
					.map((entry, index) => renderEntry(wadFile, "wad", entry, index, this.loadAsset))
					.forEach(tr => frag.appendChild(tr));
				this.dom.entries.appendChild(frag);
			} else if (name === "vswap") {
				const { VswapFile } = await import("../lib/ted-file.js");
				const vswapFile = new VswapFile(arrayBuffer);
				this.files.set("vswap", vswapFile);
				vswapFile.entries
					.map((entry, index) => renderEntry(vswapFile, "vswap", entry, index, this.loadAsset))
					.forEach(tr => frag.appendChild(tr));
				this.dom.entries.appendChild(frag);
			} else if (["rtl", "rtc"].includes(extension)) {
				const { RtlFile } = await import("../lib/rtl-file.js");
				const rtlFile = new RtlFile(arrayBuffer);
				this.files.set("rott-map", rtlFile);
				rtlFile.maps
					.map((map, index) => renderEntry(rtlFile, "rtl", map, index, this.loadAsset))
					.forEach(tr => frag.appendChild(tr));
				this.dom.maps.appendChild(frag);
			} else if (tedMapNames.includes(name)) {
				const { GameMapsFile, MapHeadFile } = await import("../lib/ted-file.js");
				const headerFile = files.find(f => tedMapHeaderNames.includes(getName(f.name)));
				if (headerFile) {
					const camackCompressed = name === "gamemaps";
					const headerArrayBuffer = await readFile(headerFile);
					const mapFile = new GameMapsFile(arrayBuffer, new MapHeadFile(headerArrayBuffer), camackCompressed);
					this.files.set("gamemaps", mapFile);
					mapFile.maps
						.map((map, index) => renderEntry(mapFile, "gamemaps", map, index, this.loadAsset))
						.forEach(tr => frag.appendChild(tr));
					this.dom.maps.appendChild(frag);
				}
			}
		}
	}
	attachEvents() {
		this.dom.assets.addEventListener("change", this.onFileSelected);
	}
	async loadAsset(file, fileType, assetId, assetType) {
		this.dom.preview.innerHTML = "";

		switch (fileType) {
			case "wad": {
				const { loadAsset } = await import("../lib/wad-asset.js");

				this.dom.preview.appendChild(loadAsset(file, assetId));
				break;
			}
			case "vswap": {
				const { loadAsset } = await import("../lib/ted-asset.js");

				this.dom.preview.appendChild(loadAsset(file, assetId, assetType));
				break;
			}
			case "rtl": {
				const { RottMap } = await import("./rott-map.js");

				const rottMap = new RottMap();
				rottMap.setMap(file.getMap(assetId));
				this.dom.preview.appendChild(rottMap);
				break;
			}
			case "wolf-map": {
				const { TedMap } = await import("./ted-map.js");
				const { wolfPallet } = await import("../lib/wolf-asset.js");
				const { extractWalls } = await import("../lib/ted-asset.js");

				const tedMap = new TedMap();
				tedMap.setMap(file.getMap(assetId));
				const vswap = this.files.get("vswap");
				tedMap.setWallBitmaps(vswap ? extractWalls(vswap) : null);
				tedMap.setPallet(wolfPallet);
				this.dom.preview.appendChild(tedMap);
				break;
			}
		}
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("asset-reader", AssetReader);