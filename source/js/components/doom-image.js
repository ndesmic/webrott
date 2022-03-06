customElements.define("doom-image",
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
			element.updateHeight = element.updateHeight.bind(element);
			element.setLump = element.setLump.bind(element);
		}
		connectedCallback() {
			this.render();
			this.cacheDom();
			this.attachEvents();
			this.renderImage();
		}
		render() {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="css/system.css">
				<style>
					#canvas { image-rendering: pixelated; }
				</style>
				<canvas id="canvas"></canvas>
				<form>
					<fieldset>
						<label for="aspect">correct aspect (16:10)</label>
						<input id="aspect" type="checkbox" checked />
					</fieldset>
				</form>
			`;
		}
		cacheDom() {
			this.dom = {
				aspect: this.shadowRoot.querySelector("#aspect"),
				canvas: this.shadowRoot.querySelector("#canvas")
			};
		}
		attachEvents() {
			this.dom.aspect.addEventListener("change", this.updateHeight);
		}
		updateHeight() {
			if (this.dom.aspect.checked) {
				this.dom.canvas.style.height = `${this.height * 4 * 1.16}px`;
			} else {
				this.dom.canvas.style.height = `${this.height * 4}px`;
			}
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
		setLump(wad, lump) {
			this.wad = wad;
			this.lump = lump;
		}
		renderImage() {
			const pallet = this.wad.get("PLAYPAL") ?? this.wad.get("PAL");
			this.width = this.lump.getUint16(0, true);
			this.height = this.lump.getUint16(2, true);
			const left = this.lump.getUint16(4, true);
			const top = this.lump.getUint16(6, true);
			this.dom.canvas = this.dom.canvas;
			this.dom.canvas.height = this.height;
			this.dom.canvas.width = this.width;
			this.dom.canvas.style.height = `${this.height * 4 * 1.16}px`;  //images don't use square pixels so stretch
			this.dom.canvas.style.width = `${this.width * 4}px`;
			const context = this.dom.canvas.getContext("2d");
			const imageData = context.getImageData(0, 0, this.width, this.height);
			const columnOffsets = [];

			for (let col = 0; col < this.width; col++) {
				columnOffsets[col] = this.lump.getUint32(8 + (col * 4), true);
			}
			let index = 8 + (this.width * 4);

			for (let col = 0; col < this.width; col++) {
				while (true) {
					const rowStart = this.lump.getUint8(index);
					index += 1;
					if (rowStart === 255) break;

					const pixelCount = this.lump.getUint8(index);
					index += 1;

					//advance one more byte because of unused padding
					index += 1;

					//draw post spans
					for (let row = rowStart; row < rowStart + pixelCount; row++) {
						const pixelOffset = (row * this.width * 4) + (col * 4);
						const palletIndex = this.lump.getUint8(index);
						index += 1;
						const palletOffset = palletIndex * 3;

						imageData.data[pixelOffset] = pallet.getUint8(palletOffset); //red
						imageData.data[pixelOffset + 1] = pallet.getUint8(palletOffset + 1); //green
						imageData.data[pixelOffset + 2] = pallet.getUint8(palletOffset + 2); //blue
						imageData.data[pixelOffset + 3] = 255;
					}

					index += 1; //advance one more byte because of unused padding
				}
			}

			context.putImageData(imageData, 0, 0);
		}
	}
);
