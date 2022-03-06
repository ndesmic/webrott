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
					:host{ display: grid; grid-template-columns: 50% 50%; grid-template-rows: auto auto; grid-template-areas: "input input" "list preview"; }
					#entries li { whitespace: pre; cursor: pointer; grid-area: list; }
					#preview { grid-area: preview; }
					#preview canvas { width: 640px; height: 640px; image-rendering: pixelated;  }
					#input { grid-area: input; }
				</style>
				<div id="input">
					<label for="wad">Select WAD:</label>
					<input id="wad" type="file" />
				</div>
				<ul id="entries"></ul>
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
				for(let entry of this.wad.entries){
					const li = document.createElement("li");
					li.addEventListener("click", () => this.loadAsset(entry.name));
					li.innerHTML = `
						${entry.name},
						${entry.offset},
						${entry.size},
					`;
					this.dom.entries.appendChild(li);
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
