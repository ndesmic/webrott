import { readFile, getExtension, getName } from "../lib/file-utils.js";
import "./tab-set.js";
import "./split-panel.js";

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
		case "rott-level": {
			tr.appendChild(renderCell(entry.name));
			tr.addEventListener("click", () => loader(file, "rott-level", index));
			break;
		}
		case "gamemaps": {
			tr.appendChild(renderCell(entry.name));
			tr.addEventListener("click", () => loader(file, "ted-map", index));
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
					:host{ display: grid; grid-template-rows: auto 1fr; block-size: 100%; }
					#entries-container { grid-area: list; }
					#preview canvas { image-rendering: pixelated;  }
					#input { grid-row: 1 / 2 }
					#entries tr, #maps tr { cursor: pointer; }s
					#preview .pallet td { inline-size: 32px; block-size: 32px; }
					split-panel { inline-size: 100%; grid-row: 2 / 3; overflow: auto; --first-size: 325px; }
					split-panel::part(median) { inline-size: 0.25rem; }
				</style>
				<div id="input">
					<label for="assets">Select WAD or VSWAP:</label>
					<input id="assets" type="file" multiple />
				</div>
				<split-panel>
					<tab-set id="tabs" slot="1">
						<div slot="tabs">Content</div>
						<div id="entries-container" slot="panels">
							<table id="entries"></table>
						</div>
						<div slot="tabs">Maps</div>
						<div id="maps-container" slot="panels">
							<table id="maps"></table>
						</div>
					</tab-set>
					<div id="preview" slot="2"></div>
				</split-panel>
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
		this.dom.maps.innerHTML = "";
		const files = Array.from(e.target.files);
		this.files = new Map();

		for (let file of files) {
			const extension = getExtension(file.name);
			const name = getName(file.name);
			const arrayBuffer = await readFile(file);

			if (tedMapHeaderNames.includes(name)) continue;  //not useful on it's own, read with other files

			const frag = document.createDocumentFragment();

			if (extension === "wad") {
				const { WadFile } = await import("../lib/wad-file.js");
				const wadFile = new WadFile(arrayBuffer);
				this.files.set("wad", wadFile);
				wadFile.entries
					.map((entry, index) => renderEntry(wadFile, "wad", entry, index, this.loadAsset))
					.forEach(tr => frag.appendChild(tr));
				this.dom.entries.appendChild(frag);
			} else if (name === "vswap") {
				const { VswapFile } = await import("../lib/ted-file.js");
				const vswapFile = new VswapFile(arrayBuffer, extension);
				this.files.set("vswap", vswapFile);
				vswapFile.entries
					.map((entry, index) => renderEntry(vswapFile, "vswap", entry, index, this.loadAsset))
					.forEach(tr => frag.appendChild(tr));
				this.dom.entries.appendChild(frag);
			} else if (["rtl", "rtc"].includes(extension)) {
				const { RottMapFile } = await import("../lib/rott-map-file.js");
				const rottMapFile = new RottMapFile(arrayBuffer);
				this.files.set("rott-map", rottMapFile);
				rottMapFile.maps
					.map((map, index) => renderEntry(rottMapFile, "rott-level", map, index, this.loadAsset))
					.forEach(tr => frag.appendChild(tr));
				this.dom.maps.appendChild(frag);
			} else if (tedMapNames.includes(name)) {
				const { GameMapsFile, MapHeadFile } = await import("../lib/ted-file.js");
				const headerFile = files.find(f => tedMapHeaderNames.includes(getName(f.name)));
				if (headerFile) {
					const camackCompressed = name === "gamemaps";
					const headerArrayBuffer = await readFile(headerFile);
					const mapFile = new GameMapsFile(arrayBuffer, new MapHeadFile(headerArrayBuffer), extension, camackCompressed);
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
			case "rott-level": {
				const { TedMap } = await import("./ted-map.js");
				const { extractWalls, extractStaticDoorEntries, getPallets, loadMap } = await import("../lib/rott-asset.js");
				const wad = this.files.get("wad");
				let walls;
				let doors;

				const tedMap = new TedMap();

				if (wad) {
					walls = extractWalls(wad);
					doors = extractStaticDoorEntries(wad);
					const doorIndexMap = Object.fromEntries(doors.map(([key, value], index) => [key, index]));
					tedMap.setMap(loadMap(file.getMap(assetId), walls.length, doorIndexMap));
					const doorTextures = doors.map(([key, value]) => value);
					tedMap.setWallBitmaps([...walls, ...doorTextures]);
					tedMap.setPallet(getPallets(wad)[0]);
				} else {
					tedMap.setMap(loadMap(file.getMap(assetId)));
				}

				/*
				for(let x of tedMap.walls){
					const b = new IndexBitmap();
					b.height = 64;
					b.width = 64;
					b.setBitmap(x);
					b.setPallet(tedMap.pallet);
					this.dom.preview.appendChild(b)
				}*/

				this.dom.preview.appendChild(tedMap);
				break;
			}
			case "ted-map": {
				const { TedMap } = await import("./ted-map.js");
				const { wolfPallet, loadMap } = await import("../lib/wolf-asset.js");
				const { blakePallet, blakeExtensions } = await import("../lib/blake-asset.js");
				const { extractWalls } = await import("../lib/ted-asset.js");

				const isBlake = blakeExtensions.includes(file.extension);

				const tedMap = new TedMap();
				tedMap.setMap(loadMap(file.getMap(assetId)));
				const vswap = this.files.get("vswap");
				tedMap.setWallBitmaps(vswap ? extractWalls(vswap) : null);
				tedMap.setPallet(
					 isBlake
						? blakePallet
						: wolfPallet);
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