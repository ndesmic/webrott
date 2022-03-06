import { getString, trimString, unCarmack, unRelew } from "./file-utils.js";
import { allocBlockArray, writeBlockSequential } from "./array-utils.js";

const numMaps = 100;

export class MapHeadFile {
	constructor(arrayBuffer) {
		this.dataView = new DataView(arrayBuffer);
		this.relwTag = this.dataView.getUint16(0, true); //must be 0xABCD
		this.headerOffsets = new Array(numMaps);
		for (let i = 0; i < numMaps; i++) {
			this.headerOffsets[i] = this.dataView.getUint32(2 + (i * 4), true);
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
	getMap(mapNum) {
		const map = this.maps[mapNum];
		const layers = new Array(3);

		for (let layerIndex = 0; layerIndex < 1; layerIndex++) {
			const planeStart = map.planeStart[layerIndex];
			const planeLength = map.planeLength[layerIndex];
			const layer = allocBlockArray(64, 64);
			const decompressedLength = this.dataView.getUint16(planeStart, true);
			const compressedData = this.dataView.buffer.slice(planeStart + 2, planeStart + planeLength);
			let decompressedData;

			if(this.carmackCompressed){
				const relwData = unCarmack(compressedData, decompressedLength);
				const dv = new DataView(relwData);
				const relwDecompressedLength = dv.getUint16(0, true);
				if (relwDecompressedLength != (map.height * map.width * 2)) throw new Error("Map data size is incorrect!");
				decompressedData = unRelew(relwData.slice(2), relwDecompressedLength, this.mapHeadFile.relwTag);
			} else {
				if(decompressedLength != (map.height * map.width * 2)) throw new Error("Map data size is incorrect!");
				decompressedData = unRelew(compressedData, decompressedLength, this.mapHeadFile.relwTag);
			}

			const layerDataView = new DataView(decompressedData);
			const decompressedWordLength = Math.floor(decompressedData.byteLength / 2);

			for(let i = 0; i < decompressedWordLength; i++){
				writeBlockSequential(layer, i, layerDataView.getUint16((i * 2), true));
			}

			layers[layerIndex] = layer;
		}
		return layers;
	}
}