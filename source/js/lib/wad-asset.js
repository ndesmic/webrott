import { getPaddedString } from "./wad-utils.js";

export function loadAsset(wad, name){
	const dataView = wad.get(name);
	if(name === "COLORMAP"){
		return getColorMap(wad, dataView);
	}
	if(name === "PLAYPAL\0" || name === "PAL\0\0\0\0\0"){
		return getPlayPal(dataView);
	}
	if(name === "PNAMES\0\0"){
		return getPNames(dataView);
	}
	if (/WALL/.test(name)) {
		return getWall(wad, dataView);
	}
	return getDoomImage(wad, dataView);
}

function getWall(wad, dataView){
	const pallet = wad.get("PLAYPAL") ?? wad.get("PAL");
	const canvas = document.createElement("canvas");
	canvas.height = 64;
	canvas.width = 64;
	const context = canvas.getContext("2d");
	const imageData = context.getImageData(0, 0, 64, 64);

	for(let col = 0; col < 64; col++){
		for(let row = 0; row < 64; row++){
			const pixelOffset = (col * 64 * 4) + (row * 4);
			const palletIndex = dataView.getUint8((row * 64) + col);
			const palletOffset = palletIndex * 3;
			imageData.data[pixelOffset] =  pallet.getUint8(palletOffset); //red
			imageData.data[pixelOffset + 1] = pallet.getUint8(palletOffset + 1); //green
			imageData.data[pixelOffset + 2] = pallet.getUint8(palletOffset + 2); //blue
			imageData.data[pixelOffset + 3] = 255
		}
	}

	context.putImageData(imageData, 0, 0);

	return canvas;
}

function getDoomImage(wad, dataView){
	const pallet = wad.get("PLAYPAL") ?? wad.get("PAL");
	const width = dataView.getUint16(0, true);
	const height = dataView.getUint16(2, true);
	const left = dataView.getUint16(4, true);
	const top = dataView.getUint16(6, true);
	const canvas = document.createElement("canvas");
	canvas.height = height;
	canvas.width = width;
	const context = canvas.getContext("2d");
	const imageData = context.getImageData(0, 0, width, height);
	const columnOffsets = [];

	for(let col = 0; col < width; col++){
		columnOffsets[col] = dataView.getUint32(8 + (col * 4), true);
	}
	let index = 8 + (width * 4);

	for(let col = 0; col < width; col++){
		const rowStart = dataView.getUint8(index);
		if(rowStart === 255) {
			index++;
			continue;
		}
		const pixelCount = dataView.getUint8(index + 1);
		index += 3; //advance one more byte because of unused padding
		for(let row = rowStart; row < rowStart + pixelCount; row++){
			const pixelOffset = (row * width * 4) + (col * 4);
			const palletIndex = dataView.getUint8(index);
			const palletOffset = palletIndex * 3;

			imageData.data[pixelOffset] = pallet.getUint8(palletOffset); //red
			imageData.data[pixelOffset + 1] = pallet.getUint8(palletOffset + 1); //green
			imageData.data[pixelOffset + 2] = pallet.getUint8(palletOffset + 2); //blue
			imageData.data[pixelOffset + 3] = 255

			index++;
		}
		index += 2; //advance one more byte because of unused padding (and some 255 value that ends the col)
	}

	context.putImageData(imageData, 0, 0);

	return canvas;
}

function getPlayPal(dataView){
	const mapCount = dataView.byteLength / 768;
	const ul = document.createElement("ul");

	for(let map = 0; map < mapCount; map++){
		const table = document.createElement("table");
		table.classList.add("pallet");
		const li = document.createElement("li");
		const h2 = document.createElement("h2");
		h2.textContent = `Pallet ${map}`;
		
		for(let row = 0; row < 16; row++){
			const tableRow = document.createElement("tr");

			for(let col = 0; col < 16; col++){
				const tableCell = document.createElement("td");

				const offset = (map * 768) + (row * 16 * 3) + (col * 3);
				const red = dataView.getUint8(offset);
				const green = dataView.getUint8(offset + 1);
				const blue = dataView.getUint8(offset + 2);

				tableCell.style.backgroundColor = `rgb(${red},${green},${blue})`;
				tableRow.appendChild(tableCell);
			}
			table.appendChild(tableRow);
		}
		li.appendChild(h2)
		li.appendChild(table);
		ul.appendChild(li);
	}

	return ul;
}

function getColorMap(wad, dataView){
	//get base pallet
	const playPal = wad.get("PLAYPAL") ?? wad.get("PAL");
	const mapCount = dataView.byteLength / 256;
	const ul = document.createElement("ul");

	for(let map = 0; map < mapCount; map++){
		const li = document.createElement("li");
		const table = document.createElement("table");
		table.classList.add("pallet");
		const h2 = document.createElement("h2");
		h2.textContent = `ColorMap ${map}`;

		for (let row = 0; row < 16; row++) {
			const tableRow = document.createElement("tr");

			for (let col = 0; col < 16; col++) {
				const tableCell = document.createElement("td");

				const playPalIndex = dataView.getUint8((map * 256) + (row * 16) + col) * 3;
				const red = playPal.getUint8(playPalIndex);
				const green = playPal.getUint8(playPalIndex + 1);
				const blue = playPal.getUint8(playPalIndex + 2);

				tableCell.style.backgroundColor = `rgb(${red},${green},${blue})`;
				tableRow.appendChild(tableCell);
			}
			table.appendChild(tableRow);
		}

		li.appendChild(h2)
		li.appendChild(table);
		ul.appendChild(li);
	}

	return ul;
}

function getPNames(dataView){
	const patchCount = dataView.getUint32(0, true);
	const section = document.createElement("section");
	const ul = document.createElement("ul");
	const div = document.createElement("div");
	div.textContent = `Wall Patch Count: ${patchCount}`;

	for(let i = 0; i < patchCount; i++){
		const li = document.createElement("li");
		li.textContent = getPaddedString(dataView, 4 + (i * 8));

		ul.appendChild(li);
	}

	section.appendChild(div);
	section.appendChild(ul);

	return section;
}