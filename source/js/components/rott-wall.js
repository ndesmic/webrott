customElements.define("rott-wall",
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
			element.setLump = element.setLump.bind(element);
		}
		connectedCallback() {
			this.render();
			this.cacheDom();
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
			`;
		}
		cacheDom() {
			this.dom = {
				canvas: this.shadowRoot.querySelector("#canvas")
			};
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
		setLump(wad, lump) {
			this.wad = wad;
			this.lump = lump;
		}
		renderImage() {
			const pallet = this.wad.get("PAL");
			this.dom.canvas.height = 64;
			this.dom.canvas.width = 64;
			this.dom.canvas.style.width = 64 * 4 + "px";
			this.dom.canvas.style.height = 64 * 4 + "px";
			const context = this.dom.canvas.getContext("2d");
			const imageData = context.getImageData(0, 0, 64, 64);

			for (let col = 0; col < 64; col++) {
				for (let row = 0; row < 64; row++) {
					const pixelOffset = (col * 64 * 4) + (row * 4);
					const palletIndex = this.lump.getUint8((row * 64) + col);
					const palletOffset = palletIndex * 3;
					imageData.data[pixelOffset] = pallet.getUint8(palletOffset); //red
					imageData.data[pixelOffset + 1] = pallet.getUint8(palletOffset + 1); //green
					imageData.data[pixelOffset + 2] = pallet.getUint8(palletOffset + 2); //blue
					imageData.data[pixelOffset + 3] = 255
				}
			}

			context.putImageData(imageData, 0, 0);
		}
	}
);
