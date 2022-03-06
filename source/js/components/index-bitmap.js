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
		element.updateHeight = element.updateHeight.bind(element);
		element.attachEvents = element.attachEvents.bind(element);
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.attachEvents();
		this.renderImage();
	}
	render() {
		this.attachShadow({ mode: "open" });
		const scaleFactor = this.scaleFactor ?? 4;
		this.shadowRoot.innerHTML = `
				<style>
					#canvas canvas { image-rendering: pixelated; width: ${scaleFactor * this.width}px; height: ${scaleFactor * this.height}px }
					fieldset { border: none; }
				</style>
				<div id="canvas"></div>
				<form>
					<fieldset>
						<label for="aspect">correct aspect (16:10)</label>
						<input id="aspect" type="checkbox" checked />
					</fieldset>
				</form>
			`;
	}
	updateHeight() {
		const scaleFactor = this.scaleFactor ?? 4;
		const canvas = this.dom.canvas.querySelector("canvas");
		
		if(!canvas) return;

		if (this.dom.aspect.checked) {
			canvas.style.height = `${this.height * scaleFactor * 1.16}px`;
		} else {
			canvas.style.height = `${this.height * scaleFactor}px`;
		}
	}
	cacheDom() {
		this.dom = {
			canvas: this.shadowRoot.querySelector("#canvas"),
			aspect: this.shadowRoot.querySelector("#aspect")
		};
	}
	attachEvents(){
		this.dom.aspect.addEventListener("change", this.updateHeight);
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
		this.updateHeight();
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("index-bitmap", IndexBitmap);
