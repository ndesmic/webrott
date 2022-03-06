import { Wad } from "../lib/wad.js";
import { loadAsset } from "../lib/wad-asset.js";

customElements.define("wad-reader",
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
				<link rel="stylesheet" href="css/system.css">
				<style>
					:host{ display: grid; grid-template-columns: 50% 50%; grid-template-rows: 45px minmax(0, calc(100% - 45px)); height: 100%; grid-template-areas: "input input" "list preview"; }
					#entries-container { grid-area: list; cursor: pointer; overflow-y: auto; }
					#preview { grid-area: preview; overflow-y: auto; }
					#preview canvas { image-rendering: pixelated;  }
					#input { grid-area: input; }

					#preview .pallet td { width: 32px; height: 32px; }
				</style>
				<div id="input">
					<label for="wad">Select WAD:</label>
					<input id="wad" type="file" />
				</div>
				<div id="entries-container">
					<table id="entries"></table>
				</div>
				<div id="preview"></div>
			`;
		}
		cacheDom(){
			this.dom = {
				wad: this.shadowRoot.querySelector("#wad"),
				entries: this.shadowRoot.querySelector("#entries"),
				preview: this.shadowRoot.querySelector("#preview")
			};
		}
		attachEvents(){
			this.dom.wad.addEventListener("change", async e => {
				const arrayBuffer = await readFile(e.target.files[0]);
				this.wad = new Wad(arrayBuffer);
				this.dom.entries.innerHTML = "";
				let index = 1;
				for(let entry of this.wad.entries){
					const tr = document.createElement("tr");
					tr.addEventListener("click", () => this.loadAsset(entry.name));
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
			});
		}
		loadAsset(name){
			this.dom.preview.innerHTML = "";
			this.dom.preview.appendChild(loadAsset(this.wad, name));
		}
		attributeChangedCallback(name, oldValue, newValue){
			this[name] = newValue;
		}
	}
);

function readFile(file){
	return new Promise((res, rej) => {
		const fileReader = new FileReader();
		fileReader.onload = e => res(e.target.result);
		fileReader.onerror = rej;
		fileReader.readAsArrayBuffer(file);
	});
}
