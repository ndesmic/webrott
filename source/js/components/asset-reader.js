import { readFile, getExtension, getName } from "../lib/file-utils.js";
import "./tab-set.js";
import "./wc-split-panel.js";

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
		case "grp": {
			tr.appendChild(renderCell(entry.name));
			tr.appendChild(renderCell(entry.offset));
			tr.appendChild(renderCell(entry.size));
			tr.addEventListener("click", () => loader(file, "grp", entry.name));
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
					#entries-container { grid-area: list; overflow: auto; block-size: 100%; }
					#preview canvas { image-rendering: pixelated;  }
					#input { padding: 0.5rem; grid-row: 1; }
					#entries tr, #maps tr { cursor: pointer; }
					wc-split-panel { inline-size: 100%; grid-row: 2 / 3; --first-size: 325px; overflow: hidden; }
					wc-split-panel::part(median) { inline-size: 0.25rem; }
					#panel-left { block-size: 100%; display: grid; grid-template-rows: auto 1fr; overflow: hidden; }
					#tabs { grid-row: 2; overflow: hidden; }

					#preview { block-size: 100%; inline-size: 100%; overflow: hidden; }
					#preview ted-map { block-size: 100%; inline-size: 100%; overflow: hidden; }
				</style>
				<wc-split-panel>
					<div id="panel-left" slot="1">
						<div id="input">
							<label for="assets">Select WAD or VSWAP:</label>
							<input id="assets" type="file" multiple />
						</div>
						<tab-set id="tabs">
							<div slot="tabs">Content</div>
							<div id="entries-container" slot="panels">
								<table>
									<thead>
										<th>Index</th>
										<th>Name</th>
										<th>Offset</th>
										<th>Size</th>
									<thead>
									<tbody id="entries"></tbody>
								</table>
							</div>
							<div slot="tabs">Maps</div>
							<div id="maps-container" slot="panels">
								<table id="maps"></table>
							</div>
						</tab-set>
					</div>
					<div id="preview" slot="2"></div>
				</wc-split-panel>
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
			} else if (extension === "grp") {
				const { GrpFile } = await import("../lib/grp-file.js");
				const grpFile = new GrpFile(arrayBuffer);
				grpFile.entries
					.map((entry, index) => renderEntry(grpFile, "grp", entry, index, this.loadAsset))
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
			case "grp": {
				const { loadAsset } = await import("../lib/build-asset.js");

				this.dom.preview.appendChild(loadAsset(file, assetId));
				break;
			}
			case "vswap": {
				const { loadAsset } = await import("../lib/ted-asset.js");

				this.dom.preview.appendChild(loadAsset(file, assetId, assetType));
				break;
			}
			case "rott-level": {
				const { WcTileMap } = await import("./wc-tile-map.js");
				const { WcPanBox } = await import("./wc-pan-box.js");
				const { 
					extractWalls, 
					extractStaticDoorEntries,
					extractMaskedWallEntries,
					extractHimaskEntries, 
					extractExitEntries, 
					getpalettes, 
					loadMap 
				} = await import("../lib/rott-asset.js");
				const wad = this.files.get("wad");

				const tileMap = new WcTileMap();
				tileMap["tile-size"] = 64;

				if (wad) {
					const walls = extractWalls(wad);
					const doors = extractStaticDoorEntries(wad);
					const maskedWalls = extractMaskedWallEntries(wad);
					const hiMaskedWalls = extractHimaskEntries(wad);
					const exits = extractExitEntries(wad);

					const doorIndexMap = Object.fromEntries(doors.map(([key, value], index) => [key, index]));
					const maskedIndexMap = Object.fromEntries([...hiMaskedWalls, ...maskedWalls, ...exits].map(([key, value], index) => [key, index]));

					const [map, transforms] = loadMap(file.getMap(assetId), walls.length, doorIndexMap, maskedIndexMap)
					tileMap.map = map;
					tileMap.transforms = transforms;
					const doorTextures = doors.map(([key, value]) => value);
					const hiMaskedWallTextures = hiMaskedWalls.map(([key, value]) => value);
					const maskedWallTextures = maskedWalls.map(([key, value]) => value);
					const exitTextures = exits.map(([key, value]) => value);
					tileMap.tiles = [...walls, ...doorTextures, ...hiMaskedWallTextures, ...maskedWallTextures, ...exitTextures];
					tileMap.palette = getpalettes(wad)[0];
				} else {
					const [map, _] = loadMap(file.getMap(assetId));
					tileMap.map = map;
				}

				const panBox = new WcPanBox();
				panBox.append(tileMap);

				this.dom.preview.appendChild(panBox);
				break;
			}
			case "ted-map": {
				const { WcTileMap } = await import("./wc-tile-map.js");
				const { WcPanBox } = await import("./wc-pan-box.js");
				const { wolfpalette, loadMap } = await import("../lib/wolf-asset.js");
				const { blakepalette, blakeExtensions } = await import("../lib/blake-asset.js");
				const { extractWalls } = await import("../lib/ted-asset.js");

				const isBlake = blakeExtensions.includes(file.extension);

				const tileMap = new WcTileMap();
				tileMap["tile-size"] = 64;

				const map = loadMap(file.getMap(assetId));
				tileMap.map = map;
				const vswap = this.files.get("vswap");
				tileMap.tiles = (vswap ? extractWalls(vswap) : null);
				tileMap.palette = isBlake ? blakepalette : wolfpalette;

				const panBox = new WcPanBox();
				panBox.append(tileMap);

				this.dom.preview.appendChild(panBox);
				break;
			}
		}
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("asset-reader", AssetReader);