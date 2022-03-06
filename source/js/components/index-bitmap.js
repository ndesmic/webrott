import { renderIndexedBitmap } from "../lib/image-utils.js";

export class IndexBitmap extends HTMLElement {
	static get observedAttributes() {
		return ["width", "height", "scalefactor"];
	}
	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.cacheDom = element.cacheDom.bind(element);
		element.render = element.render.bind(element);
		element.setBitmap = element.setBitmap.bind(element);
		element.setPallet = element.setPallet.bind(element);
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.renderImage();
	}
	render() {
		this.attachShadow({ mode: "open" });
		const scaleFactor = this.scaleFactor ?? 4;
		this.shadowRoot.innerHTML = `
				<style>
					#canvas canvas { image-rendering: pixelated; width: ${scaleFactor * this.width}px; height: ${scaleFactor * this.height}px }
				</style>
				<div id="canvas"></div>
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
	setBitmap(bitmap) { //2d height x width array of int
		this.bitmap = bitmap;
	}
	setPallet(pallet) { //1d array of [red,green,blue]
		this.pallet = pallet;
	}
	renderImage() {
		const canvas = renderIndexedBitmap(this.bitmap, this.pallet, this.width, this.height);
		if(this.dom.canvas.childNodes.length > 0){
			this.dom.canvas.removeChild(this.dom.canvas.firstChild);
		}
		this.dom.canvas.appendChild(canvas);
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("index-bitmap", IndexBitmap);
