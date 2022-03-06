import { forEachBlock } from "../lib/array-utils.js";

customElements.define("rtl-map",
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
				<div class="keyval">
					<span class="key">Floor:</span>
					<span class="value" id="floor"><span>
				</div>
				<div class="keyval">
					<span class="key">Ceiling:</span>
					<span class="value" id="ceiling"><span>
				</div>
				<div class="keyval">
					<span class="key">Brightness:</span>
					<span class="value" id="brightness"><span>
				</div>
				<div class="keyval">
					<span class="key">Light Fade:</span>
					<span class="value" id="fade"><span>
				</div>
				<div class="keyval">
					<span class="key">Height:</span>
					<span class="value" id="height"><span>
				</div>
				<div class="keyval">
					<span class="key">Sky Level:</span>
					<span class="value" id="sky-level"><span>
				</div>
				<div class="keyval">
					<span class="key">Fog:</span>
					<span class="value" id="fog"><span>
				</div>
				<div class="keyval">
					<span class="key">Light Source:</span>
					<span class="value" id="light-source"><span>
				</div>
				<div class="keyval">
					<span class="key">Lightning:</span>
					<span class="value" id="lightning"><span>
				</div>
				<div class="keyval">
					<span class="key">Music Track:</span>
					<span class="value" id="music"><span>
				</div>
				<div>Timers:</div>
				<ul id="timers"></ul>
				<table id="table"></table>
			`;
		}
		cacheDom() {
			this.dom = {
				table: this.shadowRoot.querySelector("#table"),
				floor: this.shadowRoot.querySelector("#floor"),
				ceiling: this.shadowRoot.querySelector("#ceiling"),
				brightness: this.shadowRoot.querySelector("#brightness"),
				fade: this.shadowRoot.querySelector("#fade"),
				height: this.shadowRoot.querySelector("#height"),
				skyLevel: this.shadowRoot.querySelector("#sky-level"),
				fog: this.shadowRoot.querySelector("#fog"),
				lightSource: this.shadowRoot.querySelector("#light-source"),
				lightning: this.shadowRoot.querySelector("#lightning"),
				music: this.shadowRoot.querySelector("#music"),
				timers: this.shadowRoot.querySelector("#timers")
			};
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
		setMap(map) {
			this.map = map;
		}
		renderMap() {
			this.dom.floor.textContent = this.map[0][0][0];
			this.dom.ceiling.textContent = this.map[0][0][1];
			this.dom.brightness.textContent = this.map[0][0][2];
			this.dom.fade.textContent = this.map[0][0][3];
			this.dom.height.textContent = this.map[1][0][0];
			this.dom.skyLevel.textContent = this.map[1][0][1];
			this.dom.fog.textContent = this.map[1][0][2] === 0x68 ? "No Fog" : this.map[1][0][2] === 0x69 ? "Fog" : "maybe fog?";
			this.dom.lightSource.textContent = this.map[1][0][3] === 0x8b ? "Illuminate" : "none";
			let lightning = false;

			forEachBlock(this.map[1], (tile, row, col) => {
				if(tile === 377){
					lightning = true;
				}
				if(tile === 121){
					const timerLocation = this.map[2][row][col];
					const x = (timerLocation >> 8) & 0xff;
					const y = timerLocation & 0xff;
					const timerValue = this.map[2][y][x];
					const minutes = (timerValue >> 8) & 0xff;
					const seconds = timerValue & 0xff;
					let endTime;

					//This is not accurate, we actually need to look to see if the tilemap has data at the test location and if not it contains the timer.  We don't have a tilemap yet so this will probably do for now.
					if(this.map[2][y][x+1]){
						endTime = this.map[2][y][x+1];
					} else if (this.map[2][y][x - 1]){
						endTime = this.map[2][y][x-1];
					} else if (this.map[2][y+1][x]){
						endTime = this.map[2][y+1][x];
					} else if (this.map[2][y-1][x]){
						endTime = this.map[2][y-1][x];
					} else {
						throw new Error(`Can't find end timer for timer at location ${x},${y}`);
					}

					const endMinutes = (endTime >> 8) & 0xff;
					const endSeconds = endTime & 0xff;

					const li = document.createElement("li");
					li.textContent = `X: ${x}, Y: ${y}, Start Time: ${String(minutes).padStart(2,0)}:${String(seconds).padStart(2,0)}, End Time: ${String(endMinutes).padStart(2,0)}:${String(endSeconds).padStart(2,0)}`;
					this.dom.timers.appendChild(li);
				}
			});

			this.dom.lightning.textContent = lightning ? "true" : "false";

			let music;
			forEachBlock(this.map[2], (value, row, col) => {
				if((value >> 8) === 0xba){
					music = value & 0xff;
				}
			});

			this.dom.music.textContent = music ?? 0;
		}
	}
);
