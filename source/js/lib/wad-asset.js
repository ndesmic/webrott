import { getString, trimString } from "./file-utils.js";
import { IndexBitmap } from "../components/index-bitmap.js"
import { 
	loadUnknownSprite
} from "./rott-asset.js";
import { loadImage as loadDoomImage } from "./doom-asset.js";

export function loadAsset(wad, name){
	name = trimString(name);
	const dataView = wad.getByName(name);
	if(dataView.byteLength === 0) return getNullAsset();
	if(name === "COLORMAP"){
		return getColorMap(wad, dataView);
	}
	if(name === "PLAYPAL" || name === "PAL"){
		return getPlayPal(dataView);
	}
	if(name === "PNAMES"){
		return getPNames(dataView);
	}
	if(name === "CHNGLG"){
		return getChangeLog(dataView);
	}

	return wad.getType() === "rott"
		? getRottImageAsset(wad, dataView) 
		: getDoomImage(wad, dataView);
}

function getNullAsset(){
	const div = document.createElement("div");
	div.textContent = "Asset is null";
	return div;
}

function getRottImageAsset(wad, dataView){
	const bitmap = loadUnknownSprite(dataView);
	const palettes = loadpalettes(wad.getByName("PAL"));

	const indexBitmap = new IndexBitmap();
	indexBitmap.setBitmap(bitmap);
	indexBitmap.setpalette(palettes[0]);
	indexBitmap.height = bitmap.length;
	indexBitmap.width = bitmap[0].length;

	return indexBitmap;
}

function getDoomImage(wad, dataView){
	const bitmap = loadDoomImage(dataView);
	const palettes = loadpalettes(wad.getByName("PLAYPAL"));

	const indexBitmap = new IndexBitmap();
	indexBitmap.setBitmap(bitmap);
	indexBitmap.setpalette(palettes[0]);
	indexBitmap.height = bitmap.length;
	indexBitmap.width = bitmap[0].length;

	return indexBitmap;
}

export function loadpalettes(dataView){
	const mapCount = dataView.byteLength / 768;
	const palettes = new Array(mapCount);

	for (let map = 0; map < mapCount; map++) {
		const palette = new Array(256);

		for(let index = 0; index < 256; index++){
			const offset = (map * 768) + (index * 3);
			palette[index] = [
				dataView.getUint8(offset),
				dataView.getUint8(offset + 1),
				dataView.getUint8(offset + 2),
			];
		}
		palettes[map] = palette;
	}

	return palettes;
}

function getPlayPal(dataView){
	const mapCount = dataView.byteLength / 768;
	const ul = document.createElement("ul");

	for(let map = 0; map < mapCount; map++){
		const table = document.createElement("table");
		table.classList.add("palette");
		const li = document.createElement("li");
		const h2 = document.createElement("h2");
		h2.textContent = `palette ${map}`;
		
		for(let row = 0; row < 16; row++){
			const tableRow = document.createElement("tr");

			for(let col = 0; col < 16; col++){
				const tableCell = document.createElement("td");

				const offset = (map * 768) + (row * 16 * 3) + (col * 3);
				const red = dataView.getUint8(offset);
				const green = dataView.getUint8(offset + 1);
				const blue = dataView.getUint8(offset + 2);

				tableCell.style.backgroundColor = `rgb(${red},${green},${blue})`;
				tableCell.style.width = `16px`;
				tableCell.style.height = `16px`;
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
	//get base palette
	const playPal = wad.get("PLAYPAL") ?? wad.getByName("PAL");
	const mapCount = dataView.byteLength / 256;
	const ul = document.createElement("ul");

	for(let map = 0; map < mapCount; map++){
		const li = document.createElement("li");
		const table = document.createElement("table");
		table.classList.add("palette");
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
		li.textContent = getString(dataView, 4 + (i * 8), 8);

		ul.appendChild(li);
	}

	section.appendChild(div);
	section.appendChild(ul);

	return section;
}

function getChangeLog(dataView){
	const txt = getString(dataView, 0, dataView.byteLength);
	const pre = document.createElement("pre");
	pre.textContent = txt;
	return pre;
}