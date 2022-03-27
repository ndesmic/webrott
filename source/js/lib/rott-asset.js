//@ts-check

import { allocBlockArray } from "./array-utils.js";
import { loadWall } from "./ted-asset.js";
import { loadpalettes } from "./wad-asset.js";
import { trimString } from "./file-utils.js";
import { forEachLumpInSection } from "./wad-utils.js";
import { multiTry } from "./exception-utils.js";

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
				const paletteIndex = dataView.getUint8(index);
				index += 1;

				bitmap[row][col] = paletteIndex;
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
			let paletteIndex;
			for (let row = rowStart; row < rowStart + pixelCount; row++) {
				paletteIndex = dataView.getUint8(index);

				if (paletteIndex != 254) {
					index += 1;
					bitmap[row][col] = paletteIndex;
				} else {
					bitmap[row][col] = 255;
				}


			}
			if (paletteIndex === 254) {
				index += 1;
			}
		}
	}
	return bitmap;
}

export function loadUnknownSprite(dataView, debugName) {
	if (dataView.buffer.byteLength === 4096) { //optimization since walls are always 4096 bytes
		return multiTry(
			() => loadWall(dataView),
			() => loadSprite(dataView, debugName),
			() => loadTransparentSprite(dataView, debugName),
		);
	} else {
		return multiTry(
			() => loadSprite(dataView, debugName),
			() => loadTransparentSprite(dataView, debugName),
			() => loadWall(dataView)
		);
	}
}

export function extractWalls(wad) {
	const walls = [];
	forEachLumpInSection(wad, "WALL", entry => {
		if (entry.size == 0) { //should always be 4096 unless wall is missing
			walls.push(null);
		} else {
			const wall = new DataView(wad.arrayBuffer, entry.offset, entry.size);
			walls.push(loadWall(wall));
		}
	});
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

export function extractMaskedWallEntries(wad) {
	const maskedWalls = [];
	forEachLumpInSection(wad, "MASK", entry => {
		const maskedWall = new DataView(wad.arrayBuffer, entry.offset, entry.size);
		maskedWalls.push([trimString(entry.name), loadTransparentSprite(maskedWall)]);
	});
	return maskedWalls;
}

export function extractHimaskEntries(wad) {
	const hiMaskedWalls = [];
	forEachLumpInSection(wad, "HMSK", entry => {
		const hiMaskedWall = new DataView(wad.arrayBuffer, entry.offset, entry.size);
		hiMaskedWalls.push([trimString(entry.name), loadUnknownSprite(hiMaskedWall, entry.name)]);
	});
	return hiMaskedWalls;
}

export function extractExitEntries(wad) {
	const exits = [];
	forEachLumpInSection(wad, "EXIT", entry => {
		const exit = new DataView(wad.arrayBuffer, entry.offset, entry.size);
		exits.push([trimString(entry.name), loadUnknownSprite(exit)]);
	});
	return exits;
}

export function getpalettes(wad) {
	const paletteData = wad.getByName("PAL");
	return loadpalettes(paletteData);
}

function isDoorVerticalOriented(map, row, col) {
	const up = isDoor(map, row - 1, col)
		? 2
		: isWall(map, row - 1, col)
			? 1
			: 0;

	const down = isDoor(map, row + 1, col)
		? 2
		: isWall(map, row + 1, col)
			? 1
			: 0;

	const left = isDoor(map, row, col - 1)
		? 2
		: isWall(map, row, col - 1)
			? 1
			: 0;

	const right = isDoor(map, row, col + 1)
		? 2
		: isWall(map, row, col + 1)
			? 1
			: 0;

	if (up === 1 && down === 1) return true;
	if (left === 1 && right === 1) return false;
	if (up > 0 && down > 0) return true;
	if (left > 0 && right > 0) return false;
	if (up > 0) return true;
	if (down > 0) return true;
	if (left > 0) return false;
	if (right > 0) return false;
	return false; //should never happen
}

function isMaskedWallVerticalOriented(map, row, col) {
	const up = isMaskedWall(map, row - 1, col)
		? 2
		: isWall(map, row - 1, col)
			? 1
			: 0;

	const down = isMaskedWall(map, row + 1, col)
		? 2
		: isWall(map, row + 1, col)
			? 1
			: 0;

	const left = isMaskedWall(map, row, col - 1)
		? 2
		: isWall(map, row, col - 1)
			? 1
			: 0;

	const right = isMaskedWall(map, row, col + 1)
		? 2
		: isWall(map, row, col + 1)
			? 1
			: 0;

	if (up === 1 && down === 1) return true;
	if (left === 1 && right === 1) return false;
	if (up > 0 && down > 0) return true;
	if (left > 0 && right > 0) return false;
	if (up > 0) return true;
	if (down > 0) return true;
	if (left > 0) return false;
	if (right > 0) return false;
	return false; //should never happen
}

function isDoor(map, row, col) {
	const value = map[0][row][col];
	if (value >= 33 && value <= 35) return true;
	if (value >= 90 && value <= 104) return true;
	if (value >= 154 && value <= 156) return true;
	//this condition might not be correct...
	if ((value & 0x8000) && (value & 0x4000) === 1) return true;
	return false;
}

function isWall(map, row, col) {
	const value = map[0][row][col];
	if (value >= 1 && value <= 89) return true;
	if (value >= 106 && value <= 107) return true;
	if (value >= 224 && value <= 233) return true;
	if (value >= 242 && value <= 244) return true;
	return false;
}


function isMaskedWall(map, row, col){
	const value = map[0][row][col];
	if(value >= 157 && value <= 160) return true;
	if(value >= 162 && value <= 179) return true;
	if (((value & 0x8000) && (value & 0x4000)) === 1) return true;
	return false;
}

/**
Loads map as a tile map, values are tile indices.
At least right here we're only concerned with the bottom texture of masked walls for display on the 2D map.  For indexing to work properly, the maskedTexture map should contain himask entries up front, the rest do not matter.
	@param {number[][][]} map
	@param {number} wallTextureCount
	@param {Object.<string,number>} doorTextureMap
	@param {Object.<string,number>} maskedTextureMap
*/
export function loadMap(map, wallTextureCount = 105, doorTextureMap, maskedTextureMap) {
	const height = map[0].length;
	const width = map[0][0].length;
	const tileMap = allocBlockArray(height, width);
	const transformMap = allocBlockArray(height, width);

	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const value = map[0][row][col];

			//ref: RT_DOOR.C ln: 1171
			//map walls and doors
			if (value >= 1 && value <= 32) {
				tileMap[row][col] = value - 1;
				transformMap[row][col] = 0;
			} else if (value >= 33 && value <= 35) { //Snake door
				tileMap[row][col] = doorTextureMap ? wallTextureCount + doorTextureMap[doorIndexToName((value - 33) + 15)] : value;
				transformMap[row][col] = isDoorVerticalOriented(map, row, col) ? 1 : 0;
			} else if (value >= 36 && value <= 45) {
				tileMap[row][col] = value - 4;
				transformMap[row][col] = 0;
			} else if (value === 46) {
				tileMap[row][col] = 73;
				transformMap[row][col] = 0;
			} else if (value >= 49 && value <= 71) {
				tileMap[row][col] = value - 9;
				transformMap[row][col] = 0;
			} else if (value >= 80 && value <= 89) {
				tileMap[row][col] = value - 16;
				transformMap[row][col] = 0;
			} else if (value >= 90 && value <= 104) { //Doors
				tileMap[row][col] = doorTextureMap ? wallTextureCount + doorTextureMap[doorIndexToName((value - 90))] : value;
				transformMap[row][col] = isDoorVerticalOriented(map, row, col) ? 1 : 0;
			} else if (value >= 154 && value <= 156) { //Doors
				tileMap[row][col] = doorTextureMap ? wallTextureCount + doorTextureMap[doorIndexToName((value - 154) + 18)] : value;
				transformMap[row][col] = isDoorVerticalOriented(map, row, col) ? 1 : 0;
			}

			//map masked walls
			if (maskedTextureMap) {
				const doorTextureCount = Object.keys(doorTextureMap).length;
				//Masked Walls Go Here (ref: RT_TED.C, ln: 2637)
				const type = tileToMakedType(value);
				if (type) {
					const texture = maskedTypeToTexture(type).bottom;
					if (typeof (texture) === "number") {
						tileMap[row][col] = wallTextureCount + doorTextureCount + texture;
						transformMap[row][col] = isMaskedWallVerticalOriented(map, row, col) ? 1 : 0;
					} else {
						tileMap[row][col] = wallTextureCount + doorTextureCount + maskedTextureMap[texture];
						transformMap[row][col] = isMaskedWallVerticalOriented(map, row, col) ? 1 : 0;
					}
				}
			} else {
				tileMap[row][col] = value;
			}
		}
	}

	return [tileMap, transformMap];
}

function doorIndexToName(value) {
	switch (value) {
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

function tileToMakedType(value) {
	switch (value) {
		case 157: return "mw_highswitchoff";
		case 158: return "mw_multi1";
		case 159: return "mw_multi2";
		case 160: return "mw_multi3";
		case 162: return "mw_normal1";
		case 163: return "mw_normal1";
		case 164: return "mw_normal2";
		case 165: return "mw_normal2";
		case 166: return "mw_normal3";
		case 167: return "mw_normal3";
		case 168: return "mw_singlepane";
		case 169: return "mw_singlepane";
		case 170: return "mw_dogwall";
		case 171: return "mw_peephole";
		case 172: return "mw_exitarch";
		case 173: return "mw_secretexitarch";
		case 174: return "mw_entrygate";
		case 175: return "mw_highswitchon";
		case 176: return "mw_multi1";
		case 177: return "mw_multi2";
		case 178: return "mw_multi3";
		case 179: return "mw_railing";
		default: return null;
	}
}

function maskedTypeToTexture(value, isMetal) {
	switch (value) {
		case "mw_peephole": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "PEEPMASK" };
		case "mw_dogwall": return { side: "SIDE21", mid: "ABOVEM9", top: "ABOVEM4", bottom: "DOGMASK" };
		case "mw_multi1": return { side: "SIDE21", mid: "ABOVEM5A", top: "ABOVEM5", bottom: "MULTI1" };
		case "mw_multi2": return { side: "SIDE21", mid: "ABOVEM5B", top: "ABOVEM5", bottom: "MULTI2" };
		case "mw_multi3": return { side: "SIDE21", mid: "ABOVEM5C", top: "ABOVEM5", bottom: "MULTI3" };
		case "mw_singlepane": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "MASKED4" };
		case "mw_normal1": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "MASKED1" };
		case "mw_normal2": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "MASKED2" };
		case "mw_normal3": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "MASKED3" };
		case "mw_exitarch": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "EXITARCH" };
		case "mw_secretexitarch": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "EXITARCA" };
		case "mw_railing": return { side: null, mid: null, top: null, bottom: "RAILING" };
		case "mw_hiswitchon": return { side: null, mid: 1, top: 3, bottom: 0 };
		case "mw_hiswitchoff:": return { side: null, mid: 1, top: 2, bottom: 0 };
		case "mw_platform1": return { side: null, mid: null, top: isMetal ? 15 : 10, bottom: null };
		case "mw_platform2": return { side: null, mid: null, top: null, bottom: isMetal ? 14 : 8 };
		case "mw_platform3": return { side: null, mid: null, top: isMetal ? 15 : 10, bottom: isMetal ? 14 : 8 };
		case "mw_platform4": return { side: null, mid: isMetal ? 15 : 7, top: isMetal ? 15 : 7, bottom: isMetal ? null : 12 };
		case "mw_platform5": return { side: null, mid: isMetal ? 15 : 7, top: isMetal ? null : 5, bottom: isMetal ? null : 12 };
		case "mw_platform6": return { side: null, mid: isMetal ? 15 : 7, top: isMetal ? null : 5, bottom: isMetal ? 14 : 4 };
		case "mw_platform7": return { side: null, mid: isMetal ? 15 : 7, top: isMetal ? null : 5, bottom: isMetal ? 14 : 4 }; //the same as mw_platform6?
		case "mw_entrygate": return { side: "SIDE21", mid: "ABOVEM4A", top: "ABOVEM4", bottom: "ENTRARCH" };
		default: throw new Error(`Masked index ${value} does not coorispond to a ROTT masked wall asset.`)
	}
}