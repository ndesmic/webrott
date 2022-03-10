import { allocBlockArray } from "./array-utils.js";
import { loadWall } from "./ted-asset.js";
import { extractPallets } from "./wad-asset.js";
import { trimString } from "./file-utils.js";

export function loadSprite(asset) {
	const dataView = asset instanceof DataView ? asset : new DataView(asset);

	const origSize = dataView.getUint16(0, true);
	const width = dataView.getUint16(2, true);
	const height = dataView.getUint16(4, true);
	const left = dataView.getUint16(6, true);
	const top = dataView.getUint16(8, true);
	const columnOffsets = new Array(width);

	for (let col = 0; col < width; col++) {
		columnOffsets[col] = dataView.getUint16(10 + (col * 2), true);
	}
	let index = 10 + (width * 2);

	const bitmap = allocBlockArray(width, height);

	for (let col = 0; col < width; col++) {
		while (true) {
			let rowStart = dataView.getUint8(index);
			index += 1;
			if (rowStart === 255) break;

			const pixelCount = dataView.getUint8(index);
			index += 1;

			//draw post spans
			for (let row = rowStart; row < rowStart + pixelCount; row++) {
				const palletIndex = dataView.getUint8(index);
				index += 1;

				bitmap[row][col] = palletIndex;
			}
		}
	}

	return bitmap;
}

export function loadTransparentSprite(asset) {
	const dataView = asset instanceof DataView ? asset : new DataView(asset);

	const origSize = dataView.getUint16(0, true);
	const width = dataView.getUint16(2, true);
	const height = dataView.getUint16(4, true);
	const left = dataView.getUint16(6, true);
	const top = dataView.getUint16(8, true);
	const transparency = dataView.getUint16(10, true)
	const columnOffsets = new Array(width);

	for (let col = 0; col < width; col++) {
		columnOffsets[col] = dataView.getUint16(12 + (col * 2), true);
	}
	let index = 12 + (width * 2);

	const bitmap = allocBlockArray(width, height);

	for (let col = 0; col < width; col++) {
		while (true) {
			let rowStart = dataView.getUint8(index);
			index += 1;
			if (rowStart === 255) break;

			const pixelCount = dataView.getUint8(index);
			index += 1;

			//draw post spans
			for (let row = rowStart; row < rowStart + pixelCount; row++) {
				const palletIndex = dataView.getUint8(index);
				index += 1;

				bitmap[row][col] = palletIndex;
			}
		}
	}

	return bitmap;
}

export function extractWalls(wad) {
	let isWalls = false;
	const walls = [];
	for(let i = 0; i < wad.entries.length; i++){
		const entry = wad.entries[i];

		if(entry.name === "WALLSTOP") break;
		if(isWalls){ 
			if (entry.size == 0) { //should always be 4096 unless wall is missing
				walls.push(null);
			} else {
				const wall = new DataView(wad.arrayBuffer, entry.offset, entry.size);
				walls.push(loadWall(wall));
			}
		}
		if(entry.name === "WALLSTRT") isWalls = true;
	}
	return walls;
}

export function extractStaticDoorEntries(wad) {
	let isDoors = false;
	const doors = [];
	for (let i = 0; i < wad.entries.length; i++) {
		const entry = wad.entries[i];

		if (entry.name === "DOORSTOP") break;
		if (isDoors) {
			if (entry.size == 4096 && entry.name != "SDOOR4A") { //pretty hacky but at least there's only a few doors and this is the only case where size is 4096 and it's not a 64x64 bitmap image
				const door = new DataView(wad.arrayBuffer, entry.offset, entry.size);
				doors.push([trimString(entry.name), loadWall(door)]);
				i += 8; //skip animation frames
			}
		}
		if (entry.name === "DOORSTRT") isDoors = true;
	}
	return doors;
}

export function getPallets(wad) {
	const palletData = wad.getByName("PAL");
	return extractPallets(palletData);
}

export function loadMap(map, wallTextureCount = 105, doorTextureMap) {
	const height = map[0].length;
	const width = map[0][0].length;
	const tileMap = allocBlockArray(height, width);

	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const value = map[0][row][col];

			if(value >= 1 && value <= 32){
				tileMap[row][col] = value - 1;
			} else if(value >= 33 && value <= 35){ //snake door
				tileMap[row][col] = doorTextureMap ? wallTextureCount + doorTextureMap[doorIndexToName((value - 33) + 15)] : value;
			} else if(value >= 36 && value <= 45){
				tileMap[row][col] = value - 4;
			} else if(value === 46){
				tileMap[row][col] = 73;
			} else if (value >= 49 && value <= 71) {
				tileMap[row][col] = value - 9;
			} else if (value >= 80 && value <= 89){
				tileMap[row][col] = value - 16;
			} else if (value >= 90 && value <= 104){ //doors
				tileMap[row][col] = doorTextureMap ?wallTextureCount + doorTextureMap[doorIndexToName((value - 90))] : value;
			} else if (value >= 154 && value <= 156){ //doors
				tileMap[row][col] = doorTextureMap ?wallTextureCount + doorTextureMap[doorIndexToName((value - 154) + 18)] : value;
			}
		}
	}

	return tileMap;
}

function doorIndexToName(value){
	switch(value){
		case 0:
		case 8:
			return "RAMDOOR";
		case 1:
		case 9:
			return "DOOR2";
		case 2:
		case 3:
		case 13:
			return "TRIDOOR1";
		case 10:
		case 11:
		case 14:
			return "SDOOR4";
		case 12:
			return "EDOOR";
		case 15:
			return "SNDOOR";
		case 16:
			return "SNADOOR";
		case 17:
			return "SNKDOOR";
		case 18:
			return "TNDOOR";
		case 19:
			return "TNADOOR";
		case 20:
			return "TNKDOOR";
		default:
			throw new Error(`Door index ${value} does not coorispond to a ROTT door asset.`)
	}
}