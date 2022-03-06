import { getString, trimString } from "./file-utils.js";
import { allocSquareBlock, writeBlockSequential } from "./array-utils.js";

const numMaps = 100;

export class MapHeadFile {
	constructor(arrayBuffer){
		this.dataView = new DataView(arrayBuffer);
		this.relwTag = this.dataView.getUint16(0, true); //must be 0xABCD
		this.headerOffsets = new Array(numMaps);
		for(let i = 0; i < numMaps; i++){
			this.headerOffsets[i] = this.dataView.getUint32(2 + (i * 4),true);
		}
	}
}

export class GameMapsFile {
	constructor(arrayBuffer, mapHeadFile, carmackCompressed = true) {
		this.dataView = new DataView(arrayBuffer);
		this.carmackCompressed = carmackCompressed;
		this.signature = getString(this.dataView, 0, 8);
		this.mapHeadFile = mapHeadFile;
		this.maps = [];

		for (let offset of this.mapHeadFile.headerOffsets.filter(ho => ho !== 0 && ho !== 0xffffffff)) {
			this.maps.push({
				planeStart: [
					this.dataView.getUint32(offset, true),
					this.dataView.getUint32(offset + 4, true),
					this.dataView.getUint32(offset + 8, true)
				],
				planeLength: [
					this.dataView.getUint16(offset + 12, true),
					this.dataView.getUint16(offset + 14, true),
					this.dataView.getUint16(offset + 16, true)
				],
				height: this.dataView.getUint16(offset + 18, true),
				width: this.dataView.getUint16(offset + 20, true),
				name: trimString(getString(this.dataView, offset + 22, 16))
			});
		}
	}
	getMap(mapNum){
		const map = this.maps[mapNum];
		const layers = new Array(3);

		for(let layerIndex = 0; layerIndex < 3; layerIndex++){
			const wallStart = map.planeStart[layerIndex];
			const wallLength = map.planeLength[layerIndex];
			const layer = allocSquareBlock(64);

			let byteIndex = wallStart;

			const decompressedLength = this.dataView.getUint16(byteIndex, true);
			if(decompressedLength !== (64*64*2)) throw new Error(`Layer ${layerIndex} of map ${mapNum} is not a correct size!`);

			byteIndex += 2;

			let mapIndex = 0;
			while (byteIndex < (wallStart + wallLength)) {
				const tag = this.dataView.getUint16(byteIndex, true);
				if (tag === this.mapHeadFile.relwTag) { //compressed data
					const count = this.dataView.getUint16(byteIndex + 2, true);
					const value = this.dataView.getUint16(byteIndex + 4, true);
					byteIndex += 6;

					for (let i = 0; i < count; i++) {
						writeBlockSequential(layer, mapIndex, value);
						mapIndex++;
					}
				} else { //uncompressed data
					byteIndex += 2;
					writeBlockSequential(layer, mapIndex, tag);
					mapIndex++;
				}
			}
			layers[layerIndex] = layer;
		}
		return layers;
	}
}