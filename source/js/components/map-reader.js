import { readFile, getExtension, getName } from "../lib/file-utils.js";
import { RtlFile } from "../lib/rtl-file.js";
import { MapHeadFile, GameMapsFile } from "../lib/ted-file.js";
import "./rott-map.js";
import "./wolf-map.js";

const tedExtensions = ["wl1", "wl3", "wl6", "sod", "sdm", "sd1", "sd2", "sd3", "wj1", "wj6", "bm1", "bm2", "bm3"];
const rottExtensions = ["rtl", "rtc"];
const allExtensions = [...tedExtensions, ...rottExtensions];

customElements.define("map-reader",
	class extends HTMLElement {
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
					#entries-container { grid-area: list; cursor: pointer; overflow-y: auto; }
					#preview { grid-area: preview; overflow-y: auto; }
					#preview canvas { image-rendering: pixelated;  }
					#input { grid-area: input; }
				</style>
				<div id="input">
					<label for="map">Select map files:</label>
					<input id="file" type="file" multiple accept="${allExtensions.map(e => "." + e).join(",")}" />
					<div id="info">
						<p>This supports many TED compatible formats including:</p>
						<ul>
							${allExtensions.map(e => `<li>.${e.toUpperCase()}</li>`).join("\n")}
						</ul>
					</div>
				</div>
				<div id="entries-container">
					<table id="entries"></table>
				</div>
				<div id="preview"></div>
			`;
		}
		cacheDom() {
			this.dom = {
				file: this.shadowRoot.querySelector("#file"),
				entries: this.shadowRoot.querySelector("#entries"),
				preview: this.shadowRoot.querySelector("#preview"),
				info: this.shadowRoot.querySelector("#info")
			};
		}
		attachEvents() {
			this.dom.file.addEventListener("change", async e => {
				const files = Array.from(e.target.files);
				const extension = getExtension(files[0].name);
				
				if(files.length === 1 && rottExtensions.includes(extension)){
					const arrayBuffer = await readFile(files[0]);
					this.mapFile = new RtlFile(arrayBuffer);
					this.dom.entries.innerHTML = "";
					let index = 0;

					for (let map of this.mapFile.maps.filter(m => m.used)) {
						const thisIndex = index;
						const tr = document.createElement("tr");
						tr.addEventListener("click", () => this.loadMap(thisIndex, "rott"));
						const indexCell = document.createElement("td");
						indexCell.textContent = index + 1;
						const nameCell = document.createElement("td");
						nameCell.textContent = map.name;

						tr.appendChild(indexCell);
						tr.appendChild(nameCell);

						this.dom.entries.appendChild(tr);
						index++;
					}
				} else if (e.target.files.length === 2 && tedExtensions.includes(extension)){
					const gameMapFile = files.find(f => {
						const fileName = getName(f.name);
						return fileName === "gamemaps" || fileName === "maptemp";
					});

					const gameMapHeadFile = files.find(f => {
						const fileName = getName(f.name);
						return fileName === "maphead" || fileName === "mapthead";
					});

					const camackCompressed = getName(gameMapFile.name) === "gamemaps";
					const headerArrayBuffer = await readFile(gameMapHeadFile);
					const mapArrayBuffer = await readFile(gameMapFile);

					this.mapFile = new GameMapsFile(mapArrayBuffer, new MapHeadFile(headerArrayBuffer),  camackCompressed);

					this.dom.entries.innerHTML = "";
					let index = 0;

					for(let map of this.mapFile.maps){
						const thisIndex = index;
						const tr = document.createElement("tr");
						tr.addEventListener("click", () => this.loadMap(thisIndex, "wolf"));
						const indexCell = document.createElement("td");
						indexCell.textContent = index + 1;
						const nameCell = document.createElement("td");
						nameCell.textContent = map.name;

						tr.appendChild(indexCell);
						tr.appendChild(nameCell);

						this.dom.entries.appendChild(tr);
						index++;
					}
				}
				this.dom.info.classList.add("hidden");
			});
		}
		loadMap(index, type) {
			this.dom.preview.innerHTML = "";
			let map;
			switch(type){
				case "rott": {
					map = document.createElement("rott-map");
					break;
				}
				case "wolf": {
					map = document.createElement("wolf-map");
					break;
				}
			}
			map.setMap(this.mapFile.getMap(index));
			this.dom.preview.appendChild(map);
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
	}
);
