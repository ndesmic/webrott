import { getString } from "./file-utils.js";
import "../components/doom-image.js";
import "../components/rott-image.js";
import "../components/rott-wall.js";

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
	if(name === "CHNGLG\0\0"){
		return getChangeLog(dataView);
	}
	if (wad.getType() === "rott" && /WALL/.test(name)) {
		return getRottWall(wad, dataView);
	}
	return wad.getType() === "rott"
		? getRottImage(wad, dataView) 
		: getDoomImage(wad, dataView);
}

function getRottWall(wad, dataView){
	const rottWall = document.createElement("rott-wall");
	rottWall.setLump(wad, dataView);

	return rottWall;
}

function getRottImage(wad, dataView){
	const rottImage = document.createElement("rott-image");
	rottImage.setLump(wad, dataView);

	return rottImage;
}

function getDoomImage(wad, dataView){
	const doomImage = document.createElement("doom-image");
	doomImage.setLump(wad, dataView);

	return doomImage;
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