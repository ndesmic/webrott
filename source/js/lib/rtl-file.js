import { getString, trimString } from "../lib/file-utils.js"
import { writeBlockSequential, allocSquareBlock } from "../lib/array-utils.js";

const mapSize = 64;
const registeredLevelTag = 0x4344;
const sharewareLevelTag = 0x4d4b;

export class RtlFile {
	constructor(arrayBuffer){
		this.arrayBuffer = arrayBuffer;
		this.dataView = new DataView(arrayBuffer);
		this.signature = getString(this.dataView, 0, 4);
		this.version = this.dataView.getUint32(4, true);
		this.maps = new Array(100);

		for(let i = 0; i < 100; i++){
			this.maps[i] = {
				used: this.dataView.getUint32((i * mapSize) + 8, true),
				crc: this.dataView.getUint32((i * mapSize) + 12, true),
				relwTag: this.dataView.getUint32((i * mapSize) + 16, true),
				mapSpecials: this.dataView.getUint32((i * mapSize) + 20, true),
				planeStart: [
					this.dataView.getUint32((i * mapSize) + 24, true),
					this.dataView.getUint32((i * mapSize) + 28, true),
					this.dataView.getUint32((i * mapSize) + 32, true)
				],
				planeLength: [
					this.dataView.getUint32((i * mapSize) + 36, true),
					this.dataView.getUint32((i * mapSize) + 40, true),
					this.dataView.getUint32((i * mapSize) + 44, true)
				],
				name: trimString(getString(this.dataView, (i * mapSize) + 48, 24))
			}
		}
	}
	getMap(mapNum){
		const map = this.maps[mapNum];
		const layers = new Array(3);

		for(let layerIndex = 0; layerIndex < 3; layerIndex++){
			const wallStart = map.planeStart[layerIndex];
			const wallLength = map.planeLength[layerIndex];
			const layer = allocSquareBlock(128);

			let byteIndex = wallStart;
			let mapIndex = 0;
			while(byteIndex < (wallStart + wallLength)){
				const tag = this.dataView.getUint16(byteIndex, true);
				if(tag === map.relwTag){ //compressed data
					const count = this.dataView.getUint16(byteIndex + 2, true);
					const value = this.dataView.getUint16(byteIndex + 4, true);
					byteIndex += 6;

					for(let i = 0; i < count; i++){
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