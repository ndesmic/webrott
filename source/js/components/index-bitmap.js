import { WorkerDispatcher } from "../lib/worker-dispatcher.js";
import { imageToCanvas } from "../lib/image-utils.js";

const renderDispatcher = new WorkerDispatcher(new Worker("./js/workers/render-worker.js", { type: "module" }));

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
					canvas { image-rendering: pixelated; width: ${scaleFactor * this.width}px; height: ${scaleFactor * this.height}px }
					fieldset { border: none; }
				</style>
				<div id="canvas-container"></div>
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
		const canvas = this.dom.canvasContainer.querySelector("canvas");
		
		if(!canvas) return;

		if (this.dom.aspect.checked) {
			canvas.style.height = `${this.height * scaleFactor * 1.16}px`;
		} else {
			canvas.style.height = `${this.height * scaleFactor}px`;
		}
	}
	cacheDom() {
		this.dom = {
			canvasContainer: this.shadowRoot.querySelector("#canvas-container"),
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
	async renderImage() {
		const bitmap = await renderDispatcher.dispatch("renderIndexedBitmap", [this.bitmap, this.pallet]);
		if (this.dom.canvasContainer.childNodes.length > 0){
			this.dom.canvasContainer.removeChild(this.dom.canvas.firstChild);
		}
		this.dom.canvasContainer.appendChild(imageToCanvas(bitmap));
		this.updateHeight();
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("index-bitmap", IndexBitmap);
