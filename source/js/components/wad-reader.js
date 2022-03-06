import { Wad } from "../lib/wad.js";

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
				<style>
					#entries li { whitespace: pre; }
				</style>
				<label for="wad">Select WAD:</label>
				<input id="wad" type="file" />
				<ul id="entries"></ul>
			`;
		}
		cacheDom(){
			this.dom = {
				wad: this.shadowRoot.querySelector("#wad"),
				entries: this.shadowRoot.querySelector("#entries")
			};
		}
		attachEvents(){
			this.dom.wad.addEventListener("change", async e => {
				const arrayBuffer = await readFile(e.target.files[0]);
				const wad = new Wad(arrayBuffer);
				for(let entry of wad.entries){
					const li = document.createElement("li");
					li.innerHTML = `
						${entry.name},
						${entry.offset},
						${entry.size},
					`;
					this.dom.entries.appendChild(li);
				}
			});
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
