export class TabSet extends HTMLElement {
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
		element.attachEvents = element.attachEvents.bind(element);
		element.selectTab = element.selectTab.bind(element);
		element.tabClick = element.tabClick.bind(element);
	}
	connectedCallback() {
		this.render();
		this.cacheDom();
		this.attachEvents();
		this.selectTab(0);
	}
	render() {
		this.attachShadow({ mode: "open" });
		this.shadowRoot.innerHTML = `
				<style>
					:host { display: grid; grid-template-rows: [tabs] 2rem [tab-panels] auto; }
					#tabs { grid-row: tabs / tab-panels; display: flex; cursor: pointer; user-select: none; border-bottom: 1px solid #000; }
					#tabs ::slotted(*) { padding: 0.5rem; background: #efefef; display: flex; align-items: center; }
					#tabs ::slotted(.selected) { border: 1px solid #000; border-bottom: none; background: #fff; top: 1px; }
					#tab-panels { grid-row: tab-panels; }
					#tab-panels ::slotted(*) { display: none; padding: 0.5rem; }
					#tab-panels ::slotted(.selected) { display: block; }
				</style>
				<div id="tabs">
					<slot id="tabs-slot" name="tabs"></slot>
				</div>
				<div id="tab-panels">
					<slot id="tab-panels-slot" name="panels"></slot>
				</div>
			`;
	}
	cacheDom() {
		this.dom = {
			tabsSlot: this.shadowRoot.querySelector("#tabs-slot"),
			tabPanelsSlot: this.shadowRoot.querySelector("#tab-panels-slot")
		};
		this.dom.tabs = Array.from(this.dom.tabsSlot.assignedNodes()).filter(n => n.nodeType === Node.ELEMENT_NODE);
		this.dom.panels = Array.from(this.dom.tabPanelsSlot.assignedNodes()).filter(n => n.nodeType === Node.ELEMENT_NODE);
	}
	attachEvents() {
		this.dom.tabsSlot.addEventListener("click", this.tabClick);
	}
	tabClick(e) {
		if (e.target.slot === "tabs") {
			const index = this.dom.tabs.indexOf(e.target);
			this.selectTab(index);
		}
	}
	selectTab(index) {
		const tab = this.dom.tabs[index];
		const panel = this.dom.panels[index];
		if(!tab || !panel) return;
		this.dom.panels.forEach(p => p.classList.remove("selected"));
		this.dom.tabs.forEach(p => p.classList.remove("selected"));
		panel.classList.add("selected");
		tab.classList.add("selected");
	}
	attributeChangedCallback(name, oldValue, newValue) {
		this[name] = newValue;
	}
}

customElements.define("tab-set", TabSet);
