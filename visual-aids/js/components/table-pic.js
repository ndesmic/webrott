import { getPallet, getTableImage } from "../libs/image-utils.js";

customElements.define("table-pic",
	class extends HTMLElement {
		static get observedAttributes() {
			return ["src", "palletsrc", "type"];
		}
		constructor() {
			super();
			this.bind(this);
		}
		bind(element) {
			element.cacheDom = element.cacheDom.bind(element);
			element.render = element.render.bind(element);
			element.attachEvents = element.attachEvents.bind(element);
		}
		async connectedCallback() {
			this.render();
			this.cacheDom();
			await this.renderTable()
			this.attachEvents();
		}
		render() {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="./css/system.css">
				<style>
					:host{ display: none; position: relative; grid-template-columns: 250px 1fr 250px;  }
					:host(.hydrated) { display: inline-grid; }
					#output { grid-column: 1 / 4; grid-row: 1 / 1; }
					table { border-spacing: 0; }
					#output td { width: 32px; height: 32px; border: 1px solid green; }
					#output td:hover { border-color: lightgreen; }
					#output th { width: 32px; height: 32px; background: #fff; top: 0; position: sticky; z-index: 1; text-align: center; }
					#output th:first-child { background: none; position: relative; }
					#output td.index-col { border: none; text-align: center; }
					#sticky-rail { grid-column: 3 / 4; grid-row: 1 / 1; pointer-events: none; }
					#sticky-rail.left { grid-column: 1 / 2; }
					#legend { position: sticky; background: #fff; border: 1px solid black; padding: 5px; box-shadow: 1px 1px 3px rgba(0,0,0,0.5); top: 1rem; margin: 1rem; height: 125px; z-index: 2; pointer-events: auto; }
					#legend.bottom { top: calc(100vh - 125px - 1rem); }
					#legend.bottom #switch-vertical::before { content: "↑"; }
					#legend .key { width: 100px; max-width: 100px; min-width: 100px; }
					button { width: 2rem; }
					#switch-horizontal::before { content: "←"; }
					#switch-vertical::before { content: "↓"; }
					#sticky-rail.left #switch-horizontal::before { content: "→"; }
				</style>
				<div id="output"></div>
				<div id="sticky-rail">
					<div id="legend">
						<table>
							<tr class="keyval">
								<td class="key">X</td>
								<td class="value" id="x-value"></td>
							</tr>
							<tr class="keyval">
								<td class="key">Y</td>
								<td class="value" id="y-value"></td>
							</tr>
							<tr class="keyval">
								<td class="key">Index</td>
								<td class="value" id="index-value"></td>
							</tr>
							<tr class="keyval">
								<td class="key">Color</td>
								<td class="value" id="color-value"></td>
							</tr>
						</table>
						<div class="row">
							<button id="switch-horizontal"></button>
							<button id="switch-vertical"></button>
						<div>
					</div>
				</div>
			`;
		}
		cacheDom() {
			this.dom = {
				output: this.shadowRoot.querySelector("#output"),
				aspect: this.shadowRoot.querySelector("#aspect"),
				canvas: this.shadowRoot.querySelector("#canvas"),
				legend: this.shadowRoot.querySelector("#legend"),
				index: this.shadowRoot.querySelector("#index-value"),
				color: this.shadowRoot.querySelector("#color-value"),
				x: this.shadowRoot.querySelector("#x-value"),
				y: this.shadowRoot.querySelector("#y-value"),
				switchHorizontal: this.shadowRoot.querySelector("#switch-horizontal"),
				switchVertical: this.shadowRoot.querySelector("#switch-vertical"),
				stickyRail: this.shadowRoot.querySelector("#sticky-rail")
			};
		}
		attachEvents(){
			this.shadowRoot.addEventListener("mouseover", e => {
				if(e.target.matches("td")){
					this.dom.index.textContent = e.target.dataset.index ?? "Null";
					this.dom.color.textContent = e.target.dataset.color ? `rgb(${(e.target.dataset.color)})` : "Null";
					this.dom.x.textContent = e.target.dataset.x;
					this.dom.y.textContent = e.target.dataset.y;
				}
			});
			this.dom.switchHorizontal.addEventListener("click", () => {
				this.dom.stickyRail.classList.toggle("left");
			});
			this.dom.switchVertical.addEventListener("click", () => {
				this.dom.legend.classList.toggle("bottom");
			});
		}
		async renderTable() {
			const asset = await fetch(this.src).then(x => x.arrayBuffer()).then(x => new DataView(x));

			let loadImage;

			if(this.type === "doom"){
				loadImage = (await import("../libs/doom-asset.js")).loadImage;
			} else if (this.type === "rott"){
				loadImage = (await import("../libs/rott-asset.js")).loadSprite;
			} else if (this.type === "ted"){
				loadImage = (await import("../libs/wolf-asset.js")).loadSprite;
			} else {
				return;
			}

			const bitmap = loadImage(asset);

			const palletBuffer = await fetch(this.palletsrc).then(x => x.arrayBuffer());

			const pallet = getPallet(palletBuffer, 256, this.type === "ted" ? 4 : 1);
			const table = getTableImage(bitmap, pallet, {
				mapFunc: (td, col, row, color, index) => {
					if(color){
						td.dataset.color = color;
					}
					if(index){
						td.dataset.index = index;
					}
					td.dataset.x = col;
					td.dataset.y = row;
					return td;
				}
			});
			this.dom.output.appendChild(table);
			this.classList.add("hydrated");
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
	}
);
