import { readFile } from "../lib/file-utils.js";
import { RtlFile } from "../lib/rtl-file.js";
import "./rtl-map.js";

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
				<link rel="stylesheet" href="css/system.css">
				<style>
					:host{ display: grid; grid-template-columns: 50% 50%; grid-template-rows: 45px minmax(0, calc(100% - 45px)); height: 100%; grid-template-areas: "input input" "list preview"; }
					#entries-container { grid-area: list; cursor: pointer; overflow-y: auto; }
					#preview { grid-area: preview; overflow-y: auto; }
					#preview canvas { image-rendering: pixelated;  }
					#input { grid-area: input; }
				</style>
				<div id="input">
					<label for="map">Select RTL/RTC:</label>
					<input id="rtl" type="file" />
				</div>
				<div id="entries-container">
					<table id="entries"></table>
				</div>
				<div id="preview"></div>
			`;
		}
		cacheDom() {
			this.dom = {
				rtl: this.shadowRoot.querySelector("#rtl"),
				entries: this.shadowRoot.querySelector("#entries"),
				preview: this.shadowRoot.querySelector("#preview")
			};
		}
		attachEvents() {
			this.dom.rtl.addEventListener("change", async e => {
				const arrayBuffer = await readFile(e.target.files[0]);
				this.rtl = new RtlFile(arrayBuffer);
				this.dom.entries.innerHTML = "";
				let index = 0;

				for (let map of this.rtl.maps.filter(m => m.used)) {
					const thisIndex = index;
					const tr = document.createElement("tr");
					tr.addEventListener("click", () => this.loadMap(thisIndex));
					const indexCell = document.createElement("td");
					indexCell.textContent = index + 1;
					const nameCell = document.createElement("td");
					nameCell.textContent = map.name;

					tr.appendChild(indexCell);
					tr.appendChild(nameCell);

					this.dom.entries.appendChild(tr);
					index++;
				}
			});
		}
		loadMap(index) {
			this.dom.preview.innerHTML = "";
			const rtlMap = document.createElement("rtl-map");
			rtlMap.setMap(this.rtl.getMap(index));
			this.dom.preview.appendChild(rtlMap);
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
	}
);
