import { allocBlockArray } from "./array-utils.js";
import { IndexBitmap } from "../components/index-bitmap.js";
import { wolfPallet, loadSprite } from "../lib/wolf-asset.js";

export function loadAsset(file, name, type){
	const asset = file.getAsset(name);
	switch(type){
		case "wall": {
			const element = new IndexBitmap();
			element.height = 64;
			element.width = 64;
			element.setBitmap(loadWall(asset));
			element.setPallet(wolfPallet);
			return element;
		}
		case "sprite": {
			const element = new IndexBitmap();
			element.height = 64;
			element.width = 64;
			element.setBitmap(loadSprite(asset, file.arrayBuffer));
			element.setPallet(wolfPallet);
			return element;
		}
	}
}

export function extractWalls(file){
	return file.entries
		.filter((x) => x.type === "wall" && x.size > 0)
		.map(x => loadWall(file.getAsset(x.name)));
}

export function loadWall(asset){
	const dataView = asset instanceof DataView ? asset : new DataView(asset);
	const height = 64;
	const width = 64;

	const bitmap = allocBlockArray(width, height);
	let i = 0;

	for(let row = 0; row < height; row++){
		for(let col = 0; col < width; col++){
			bitmap[col][row] = dataView.getUint8(i); //assets are stored in posts, not rows so we need to flip 90deg
			i += 1;
		}
	}

	return bitmap;
}

export function loadMap(map, numberOfTiles) {
	const height = map[0].length;
	const width = map[0][0].length;
	const tileMap = allocBlockArray(height, width);

	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const value = map[0][row][col];

			if (value < 64) { //wall
				tileMap[row][col] = (value - 1) * 2;
			} else if (value === 90) { //door e/w
				tileMap[row][col] = numberOfTiles - 7;
			} else if (value === 91) {  //door n/s
				tileMap[row][col] = numberOfTiles - 8;
			} else if (value === 92 || value === 94) { //gold / silver door n/s
				tileMap[row][col] = numberOfTiles - 2;
			} else if (value === 93 || value === 95) { //gold / silver door e/w
				tileMap[row][col] = numberOfTiles;
			} else if (value === 100) { //elevator door n/s
				tileMap[row][col] = numberOfTiles - 3;
			} else if (value === 101) { //elevator door e/w
				tileMap[row][col] = numberOfTiles - 4;
			}
		}
	}

	return tileMap;
}