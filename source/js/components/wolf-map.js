import { forEachBlock } from "../lib/array-utils.js";

customElements.define("wolf-map",
	class extends HTMLElement {
		static get observedAttributes() {
			return [];
		}
		constructor() {
			super();
			this.bind(this);
		}
		bind(element) {
			element.cacheDom = element.cacheDom.bind(element);
			element.render = element.render.bind(element);
			element.setMap = element.setMap.bind(element);
			element.renderMap = element.renderMap.bind(element);
		}
		connectedCallback() {
			this.render();
			this.cacheDom();
			this.renderMap();
		}
		render() {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="css/system.css">
				<style>
					#canvas { image-rendering: pixelated; }
				</style>
				<canvas id="canvas"></canvas>
			`;
		}
		cacheDom() {
			this.dom = {
				canvas: this.shadowRoot.querySelector("#canvas"),
			};
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
		setMap(map) {
			this.map = map;
		}
		renderMap() {
			const context = this.dom.canvas.getContext("2d");
			this.dom.canvas.width = 64;
			this.dom.canvas.height = 64;
			this.dom.canvas.style.width = `${64 * 4}px`;
			this.dom.canvas.style.height = `${64 * 4}px`;

			context.fillStyle = "#ffffff";
			context.fillRect(0, 0, 64, 64);
			const imageData = context.getImageData(0, 0, 64, 64);

			for(let row = 0; row < 64; row++){
				for(let col = 0; col < 64; col++){
					const value = this.map[0][row][col];
					const pixelOffset = (row * 64 * 4) + (col * 4);

					if(value < 64){ //A wall
						imageData.data[pixelOffset + 0] = 0;
						imageData.data[pixelOffset + 1] = 0;
						imageData.data[pixelOffset + 2] = 0;
						imageData.data[pixelOffset + 3] = 255;
					}
					if (value >= 90 && value < 92) { //A Door
						imageData.data[pixelOffset + 0] = 0;
						imageData.data[pixelOffset + 1] = 0;
						imageData.data[pixelOffset + 2] = 255;
						imageData.data[pixelOffset + 3] = 255;
					}
					if (value >= 92 && value < 94) { //Gold Door
						imageData.data[pixelOffset + 0] = 255;
						imageData.data[pixelOffset + 1] = 255;
						imageData.data[pixelOffset + 2] = 0;
						imageData.data[pixelOffset + 3] = 255;
					}
					if (value >= 94 && value < 96) { //Silver Door
						imageData.data[pixelOffset + 0] = 127;
						imageData.data[pixelOffset + 1] = 127;
						imageData.data[pixelOffset + 2] = 127;
						imageData.data[pixelOffset + 3] = 255;
					}
					if (value >= 100 && value < 102) { //Elevator Door
						imageData.data[pixelOffset + 0] = 255;
						imageData.data[pixelOffset + 1] = 0;
						imageData.data[pixelOffset + 2] = 255;
						imageData.data[pixelOffset + 3] = 255;
					}
				}
			}

			context.putImageData(imageData,0,0);
		}
	}
);
