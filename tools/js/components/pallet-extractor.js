import { readFile, download } from "../libs/file-utils.js";
import { getTablePallet } from "../libs/image-utils.js";

customElements.define("pallet-extractor",
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
			element.attachEvents = element.attachEvents.bind(element);
		}
		async connectedCallback() {
			this.render();
			this.cacheDom();
			this.attachEvents();
		}
		render() {
			this.attachShadow({ mode: "open" });
			this.shadowRoot.innerHTML = `
				<link rel="stylesheet" href="./css/system.css">
				<style>
					.pallet-container { display: grid; grid-template-columns: max-content; }
					.pallet-container table { grid-column: 1 / 1; grid-row: 1 / 1; }
					.pallet-container textarea { grid-column: 2 / 3; grid-row: 1 / 1; }
					.pallet-container table td { width: 16px; height: 16px; }
					
				</style>
				<label for="file">Select GAMEPAL.obj or decompressed EXE:</label>
				<input id="file" type="file" />
				<div id="pallet"></div>
				<div id="output"></div>
			`;
		}//251471
		cacheDom() {
			this.dom = {
				file: this.shadowRoot.querySelector("#file"),
				output: this.shadowRoot.querySelector("#output"),
				pallet: this.shadowRoot.querySelector("#pallet")
			};
		}
		attachEvents(){
			this.dom.file.addEventListener("change", async e => {
				const file = e.target.files[0];
				const arrayBuffer = await readFile(file);
				const start = performance.now();

				console.log("Testing: seeing if we can snoop this file for a pallet");
				const dataView = new DataView(arrayBuffer, 0);
				const sequence = [];
				const completedSequences = [];

				for(let i = 0; i < arrayBuffer.byteLength; i++){
					const value = dataView.getUint8(i);
					if(sequence.length < 768){
						sequence.push(value);
					} else if(sequence.length === 768){
						sequence.shift();
						sequence.push(value);
					}
					if (validatePallet(sequence)) {
						completedSequences.push({
							index: i - 767,
							data: [...sequence]
						});
					}
				}

				const ul = document.createElement("ul");
				for(let { index, data } of completedSequences){
					const li = document.createElement("li");
					const match = document.createElement("div");
					const palletContainer = document.createElement("div");
					palletContainer.classList.add("pallet-container");

					match.textContent = `Found match at ${index}`;
					li.appendChild(match);

					const unpackedData = unpackPallet(data);
					palletContainer.appendChild(getTablePallet(unpackedData))
					const textData = document.createElement("textarea");
					textData.innerHTML = JSON.stringify(unpackedData);
					palletContainer.appendChild(textData);
					li.appendChild(palletContainer);
					const downloadButton = document.createElement("button");
					downloadButton.addEventListener("click", () => download(new Blob([new Uint8Array(data)], { type: "application/octet-stream" }), "pallet.bin"));
					downloadButton.textContent = "Download Pallet";
					li.appendChild(downloadButton);
					ul.appendChild(li);
				}

				this.dom.output.appendChild(ul);
				
				console.log(`Done! Took ${performance.now() - start}ms`);
			});
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
	}
);

function validatePallet(sequence){
	if(sequence.length !== 768) return false;

	const set = new Set();
	for(let i = 0; i < sequence.length; i += 3){
		if(!(sequence[i] < 64 && sequence[i + 1] < 64 && sequence[i + 2] < 64)) return false;
	}
	return sequence[0] === 0
		&& sequence[1] === 0
		&& sequence[2] === 0
		&& sequence[765] === 0x26
		&& sequence[766] === 0
		&& sequence[767] === 0x22;
}

function unpackPallet(bytes){
	const pallet = [];
	for (let i = 0; i < bytes.length; i += 3) {
		pallet.push([
			bytes[i] << 2,
			bytes[i+1] << 2,
			bytes[i+2] << 2
		]);
	}
	return pallet;
}