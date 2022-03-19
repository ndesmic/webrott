export class WcPanBox extends HTMLElement {
	#zoom = 1.0;
	#lastPointer;
	#lastScroll;
	#modifierKey;
	#minZoom = 0.1;
	#maxZoom = Infinity;

	static observedAttributes = ["zoom", "min-zoom", "max-zoom", "modifier-key"];

	constructor() {
		super();
		this.bind(this);
	}
	bind(element) {
		element.attachEvents = element.attachEvents.bind(element);
		element.render = element.render.bind(element);
		element.cacheDom = element.cacheDom.bind(element);
		element.onWheel = element.onWheel.bind(element);
		element.onPointerDown = element.onPointerDown.bind(element);
		element.onPointerMove = element.onPointerMove.bind(element);
		element.onPointerUp = element.onPointerUp.bind(element);
	}
	render() {
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
            <style>
				#viewport { height: 100%; width: 100%; overflow: auto; cursor: grab; }
				#viewport.manipulating { cursor: grabbing; }
            </style>
			<div id="viewport" style="zoom: ${this.#zoom};">
            	<slot></slot>
			</div>
        `;
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.attachEvents();
	}
	cacheDom() {
		this.dom = {
			viewport: this.shadowRoot.querySelector("#viewport")
		};
		this.dom.viewport.scroll(200, 200);
	}
	attachEvents() {
		this.dom.viewport.addEventListener("wheel", this.onWheel);
		this.dom.viewport.addEventListener("pointerdown", this.onPointerDown);
	}
	onWheel(e) {
		e.preventDefault();
		this.zoom += e.deltaY / 1000;
	}
	onPointerDown(e) {
		if (!this.#isModifierDown(e)) return;
		e.preventDefault();
		this.dom.viewport.classList.add("manipulating");
		this.#lastPointer = [
			e.offsetX,
			e.offsetY
		];
		this.#lastScroll = [
			this.dom.viewport.scrollLeft,
			this.dom.viewport.scrollTop
		];;

		this.dom.viewport.setPointerCapture(e.pointerId);
		this.dom.viewport.addEventListener("pointermove", this.onPointerMove);
		this.dom.viewport.addEventListener("pointerup", this.onPointerUp);
	}
	onPointerMove(e) {
		const currentPointer = [
			e.offsetX,
			e.offsetY
		];
		const delta = [
			currentPointer[0] + this.#lastScroll[0] - this.#lastPointer[0],
			currentPointer[1] + this.#lastScroll[1] - this.#lastPointer[1]
		];

		this.dom.viewport.scroll(this.#lastScroll[0] / this.#zoom - delta[0] / this.#zoom, this.#lastScroll[1] / this.#zoom - delta[1] / this.#zoom, { behavior: "instant" });
	}
	onPointerUp(e) {
		this.dom.viewport.classList.remove("manipulating");
		this.dom.viewport.removeEventListener("pointermove", this.onPointerMove);
		this.dom.viewport.removeEventListener("pointerup", this.onPointerUp);
		this.dom.viewport.releasePointerCapture(e.pointerId);
	}
	#isModifierDown(e) {
		if (!this.#modifierKey) return true;
		if (this.#modifierKey === "ctrl" && e.ctrlKey) return true;
		if (this.#modifierKey === "alt" && e.altKey) return true;
		if (this.#modifierKey === "shift" && e.shiftKey) return true;
		return false;
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
	set zoom(val) {
		this.#zoom = Math.min(Math.max(parseFloat(val), this.#minZoom), this.#maxZoom);
		if (this.dom && this.dom.viewport) {
			this.dom.viewport.style.zoom = this.#zoom;
		}
	}
	get zoom() {
		return this.#zoom;
	}
	set ["min-zoom"](val) {
		this.#minZoom = val;
	}
	get ["min-zoom"]() {
		return this.#minZoom;
	}
	set ["max-zoom"](val) {
		this.#maxZoom = val;
	}
	get ["max-zoom"]() {
		return this.#maxZoom;
	}
	set ["modifier-key"](val) {
		this.#modifierKey = val;
	}
	get ["modifier-key"]() {
		return this.#modifierKey;
	}
}

customElements.define("wc-pan-box", WcPanBox);