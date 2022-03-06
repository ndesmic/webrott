import { Wad } from "../lib/wad.js";
import { loadAsset as loadWadAsset } from "../lib/wad-asset.js";
import { loadAsset as loadTedAsset } from '../lib/ted-asset.js';
import { readFile, getExtension, getName } from "../lib/file-utils.js";
import { VswapFile } from "../lib/ted-file.js";

customElements.define("asset-reader",
	class extends HTMLElement {
		static get observedAttributes(){
			return [];
		}
		constructor(){
			super();
			this.bind(this);
		}
		bind(element){
			element.attachEvents = element.attachEvents.bind(element);
			element.cacheDom = element.cacheDom.bind(element);
			element.render = element.render.bind(element);
		}
		connectedCallback(){
			this.render();
			this.cacheDom();
			this.attachEvents();
		}
		render(){
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="../../shared/css/system.css">
				<style>
					:host{ display: grid; grid-template-columns: 50% 50%; grid-template-rows: 45px minmax(0, calc(100% - 45px)); height: 100%; grid-template-areas: "input input" "list preview"; }
					#entries-container { grid-area: list; cursor: pointer; overflow-y: auto; }
					#preview { grid-area: preview; overflow-y: auto; }
					#preview canvas { image-rendering: pixelated;  }
					#input { grid-area: input; }

					#preview .pallet td { width: 32px; height: 32px; }
				</style>
				<div id="input">
					<label for="assets">Select WAD or VSWAP:</label>
					<input id="assets" type="file" />
				</div>
				<div id="entries-container">
					<table id="entries"></table>
				</div>
				<div id="preview"></div>
			`;
		}
		cacheDom(){
			this.dom = {
				assets: this.shadowRoot.querySelector("#assets"),
				entries: this.shadowRoot.querySelector("#entries"),
				preview: this.shadowRoot.querySelector("#preview")
			};
		}
		attachEvents(){
			this.dom.assets.addEventListener("change", async e => {
				const files = e.target.files;
				const extension =  getExtension(files[0].name);

				if(extension === "wad"){
					const arrayBuffer = await readFile(files[0]);
					this.asset = new Wad(arrayBuffer);
					this.dom.entries.innerHTML = "";
					let index = 1;
					for(let entry of this.asset.entries){
						const tr = document.createElement("tr");
						tr.addEventListener("click", () => this.loadAsset(entry.name, "wad"));
						const indexCell = document.createElement("td");
						indexCell.textContent = index;
						const nameCell = document.createElement("td");
						nameCell.textContent = entry.name;
						const offsetCell = document.createElement("td");
						offsetCell.textContent = entry.offset;
						const sizeCell = document.createElement("td");
						sizeCell.textContent = entry.size;
						
						tr.appendChild(indexCell);
						tr.appendChild(nameCell);
						tr.appendChild(offsetCell);
						tr.appendChild(sizeCell);
						
						this.dom.entries.appendChild(tr);
						index++;
					}
				} else if(getName(files[0].name) === "vswap"){
					const arrayBuffer = await readFile(files[0]);
					this.asset = new VswapFile(arrayBuffer);

					this.dom.entries.innerHTML = "";
					let index = 0;

					for (let entry of this.asset.entries) {
						const tr = document.createElement("tr");
						const i = index;
						tr.addEventListener("click", () => this.loadAsset(i, "vswap", entry.type).bind(index));
						const indexCell = document.createElement("td");
						indexCell.textContent = index;
						const typeCell = document.createElement("td");
						typeCell.textContent = entry.type;
						const offsetCell = document.createElement("td");
						offsetCell.textContent = entry.offset;
						const sizeCell = document.createElement("td");
						sizeCell.textContent = entry.size;

						tr.appendChild(indexCell);
						tr.appendChild(typeCell);
						tr.appendChild(offsetCell);
						tr.appendChild(sizeCell);

						this.dom.entries.appendChild(tr);
						index++;
					}
				}
			});
		}
		loadAsset(name, fileType, assetType){
			this.dom.preview.innerHTML = "";
			if(fileType === "wad"){
				this.dom.preview.appendChild(loadWadAsset(this.asset, name));
			} else if (fileType === "vswap"){
				this.dom.preview.appendChild(loadTedAsset(this.asset, name, assetType));
			}
		}
		attributeChangedCallback(name, oldValue, newValue){
			this[name] = newValue;
		}
	}
);