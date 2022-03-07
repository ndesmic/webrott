import { readFile, download, getName, getString } from "../libs/file-utils.js";
import { getArray16 } from "../libs/file-utils.js";
import { dosHeaderToUint16Array } from "../libs/exe-utils.js";

customElements.define("lzexe-extractor",
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
				<link rel="stylesheet" href="../shared/css/system.css">
				<style>
					#pallet table td { width: 16px; height: 16px; }
				</style>
				<label for="file">Select a EXE:</label>
				<input id="file" type="file" accepts=".exe" />
				<div id="pallet"></div>
				<div id="output"></div>
			`;
		}
		cacheDom() {
			this.dom = {
				file: this.shadowRoot.querySelector("#file"),
				output: this.shadowRoot.querySelector("#output"),
				pallet: this.shadowRoot.querySelector("#pallet")
			};
		}
		attachEvents() {
			this.dom.file.addEventListener("change", async e => {
				const file = e.target.files[0];
				const arrayBuffer = await readFile(file);

				const dataView = new DataView(arrayBuffer, 0);
				const dosHeader = {
					signature: getString(dataView, 0, 2),
					lastSize: dataView.getUint16(2, true), //bytes on last block/page of file (0 means all, not all 512 may be used)
					countOfBlocks: dataView.getUint16(4, true), //count of blocks/pages that are part of the EXE
					countOfRelocations: dataView.getUint16(6, true), //count of relocation entries
					headerSize: dataView.getUint16(8, true), //header size in paragraphs
					minAlloc: dataView.getUint16(10, true), //minimum extra paragraphs needed
					maxAlloc: dataView.getUint16(12, true), //maximum extra paragraphs needed
					stackSegment: dataView.getUint16(14, true), //initial (relative) SS value (used to set the SS register)
					stackPointer: dataView.getUint16(16, true), //initial SP value 
					checksum: dataView.getUint16(18, true), //Checksum (usually not used)
					instructionPointer: dataView.getUint16(20, true), //initial IP value
					codeSegment: dataView.getUint16(22, true), //initial (relative) CS value
					relocationTableOffset: dataView.getUint16(24, true), //address of relocation table
					overlayIndex: dataView.getUint16(26, true), //overlay index
				};

				if(
					(dosHeader.signature !== "MZ") 
					|| dosHeader.headerSize !== 2 
					|| dosHeader.overlayIndex !== 0 
					|| dosHeader.relocationTableOffset !== 0x1c
				){
					console.log(`Header incorrect for LZEXE compressed EXE.`);
					return;
				}

				const expansionHeader = {
					version: getString(dataView, 28, 4), //will often be "reserved"
					oemId: dataView.getUint16(32, true), //OEM identifier
					oemInfo: dataView.getUint16(34, true), //OEM info
					reserved2: getArray16(dataView, 36, 10), //reserved
					peOffset: dataView.getUint32(56, true) //offset to PE header
				};

				if (expansionHeader.version !== "LZ90" && expansionHeader.version !== "LZ91"){
					console.log("Version incorrect for LZEXE compressed EXE.");
					return;
				}

				const dataStart = (dosHeader.codeSegment + dosHeader.headerSize) * 16;
				const compressionInfo = {
					instructionPointer: dataView.getUint16(dataStart, true),
					codeSegment: dataView.getUint16(dataStart + 2, true),
					stackPointer: dataView.getUint16(dataStart + 4, true),
					stackSegment: dataView.getUint16(dataStart + 6, true),
					compressedSize: dataView.getUint16(dataStart + 8, true), //Size in paragraphs (16-bytes)
					increaseLoadSize: dataView.getUint16(dataStart + 10, true), //Size in paragraphs
					sizeOfDecompressor: dataView.getUint16(dataStart + 12, true), //with compressed relocation table in bytes
					checksum: dataView.getUint16(dataStart, 14, true) //Used with version 90
				}

				const decompressedHeader = {
					signature: 0x5a4d, //MZ
					instructionPointer: compressionInfo.instructionPointer,
					codeSegment: compressionInfo.codeSegment,
					stackPointer: compressionInfo.stackPointer,
					stackSegment: compressionInfo.stackSegment,
					relocationTableOffset: relocationTableOffset,
					overlayIndex: 0
				};

				const relocationTable = makeRleTable(dataView, dosHeader, decompressedHeader, expansionHeader.version);
				const data = unpack(dataView, dosHeader, compressionInfo);

				decompressedHeader.minAlloc = dosHeader.maxAlloc !== 0
					? dosHeader.minAlloc - (compressionInfo.increaseLoadSize + ((compressionInfo.sizeOfDecompressor + 16 -1) >> 4) + 9)
					: dosHeader.minAlloc;
				decompressedHeader.maxAlloc = dosHeader.maxAlloc !== 0
					? dosHeader.maxAlloc !== 0xffff 
						? dosHeader.maxAlloc - (dosHeader.minAlloc - decompressedHeader.minAlloc)
						: dosHeader.maxAlloc
					: dosHeader.maxAlloc;

				decompressedHeader.lastSize = data.byteLength + (decompressedHeader.headerSize << 4) & 0x1ff;
				decompressedHeader.countOfBlocks = (data.byteLength + (decompressedHeader.headerSize << 4) + 0x1ff) >> 9;

				const decompressedFile = new Uint16Array([
					...dosHeaderToUint16Array(decompressedHeader),
					...relocationTable,
					...data
				]);

				const blob = new Blob([decompressedFile], { type: "application/octet-stream" });
				download(blob, `${getName(file.name)}.unlzw.exe`);

				console.log("Done!");
			});
		}
		attributeChangedCallback(name, oldValue, newValue) {
			this[name] = newValue;
		}
	}
);

const relocationTableOffset = 0x1c;

function makeRleTable(dataView, dosHeader, decompressedHeader, version){
	const tableBody = [];
	const index = (dosHeader.codeSegment + dosHeader.headerSize) * 16;

	//My guess at what's going on here is we are packing things into 4-bit values and using compression codes to unpack larger values.
	if(version === "LZ91"){
		let segment = 0;
		let offset = 0;
		let count = 0;
		let relocationIndex = index + 0x158;
		while(true){
			let span = dataView.getUint8(relocationIndex);
			relocationIndex += 1;

			//we're exporting the byte except if 0 which is a control character.
			if(span === 0){
				span = dataView.getUint16(relocationIndex, true);
				relocationIndex += 2;

				if(span === 0){
					segment += 0x0fff;
				} else if (span === 1){
					break;
				}
			}

			offset += span;
			segment += (offset & ~0x0F) >> 4;  //bit masking with 0b11111111_11110000
			offset = offset & 0x0F; //bit masking with 0b00000000_00001111
			tableBody.push(offset);
			tableBody.push(segment);
			count += 1;
		}
		decompressedHeader.countOfRelocations = count;
	} else {
		throw "LZ90 not implemented. Sorry :(";
	}
	const endOfTable = relocationTableOffset + (tableBody.length * 2); // 2x because they are words
	const bytesNeededToAlignToPage = 512 - (endOfTable % 512);
	const paddingCount = bytesNeededToAlignToPage / 2; // divide by two because these are bytes and table is made of words

	for (let i = 0; i < paddingCount; i++) {
		tableBody.push(0);  //adding padding
	}

	decompressedHeader.headerSize = (relocationTableOffset + (tableBody.length * 2)) / 16;  //This points to the end of the data (page aligned), we divide by 16 because the header value is measured in unit paragraphs (16 bytes). No clue why this is part of the header size.

	return new Uint16Array(tableBody);
}

//Bitstream with a 16-bit buffer, reads a word at a time but can also return bytes (this is more so I can use this class to hold the index into the dataView instead of syncing it with an external index for reading bytes in the decompression alogrithm)
class BitStream16 {
	constructor(dataView, index){
		this.dataView = dataView;
		this.index = index;
	}
	fillBuffer(){
		this.buffer = this.dataView.getUint16(this.index, true);
		this.index += 2;
		this.bitIndex = 16;
	}
	getBit(){
		const bit = this.buffer & 1;
		this.bitIndex -= 1;
		if(this.bitIndex == 0){
			this.fillBuffer();
		} else {
			this.buffer = this.buffer >> 1;
		}
		return bit;
	}
	getUnbufferedByte(){
		const byte = this.dataView.getUint8(this.index);
		this.index += 1;
		return byte;
	}
}



function unpack(dataView, dosHeader, compressionInfo){
	let inIndex = (dosHeader.codeSegment - compressionInfo.compressedSize + dosHeader.headerSize) * 16; //in normal circumstances this is just 32, right after the header, don't think it's safe to simplify to that though, I think it just means there's no relocation table.
	const outBody = [];

	const bitStream = new BitStream16(dataView, inIndex);
	bitStream.fillBuffer();
	let i = -1;

	while(true){
		i++;
		let span;
		let length;

		if(bitStream.getBit() === 1){
			outBody.push(bitStream.getUnbufferedByte());
			continue;
		}
		if(bitStream.getBit() === 0){
			length = bitStream.getBit() << 1; //get 2bit value
			length = length | bitStream.getBit();
			length += 2;
			const nextByte = bitStream.getUnbufferedByte();
			span = nextByte | 0xff00; //we need to add the high bytes bytes but these should be signed so we take the compliment
			span = twosCompliment16(span);
		} else {
			span = bitStream.getUnbufferedByte();
			length = bitStream.getUnbufferedByte();
			span = span | (((length & ~0x7) << 5) | 0xe000); //0xe000 is 0b11100000_00000000
			span = twosCompliment16(span); //the above value will always be negative
			length = (length & 0x07) + 2;
			if(length === 2){
				length = bitStream.getUnbufferedByte();
				if(length === 0) break; //end of module
				if(length === 1) continue; // segment change
				else length += 1
			}
		}
		for(let i = 0; i < length; i++){
			outBody.push(outBody[outBody.length + span]); //span will always be a negative number
		}
	}

	return new Uint16Array(new Uint8Array(outBody).buffer);
}

//Reconstructs a signed number from an unsigned number as javascript doesn't have these concepts
function twosCompliment16(value){
	return -(0b1000000000000000 & value) + (0b0111111111111111 & value);
}