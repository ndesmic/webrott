//Assets for the BUILD engine, in case it's not clear :)
import { PaletteView } from "../components/palette-view.js";
import { allocBlockArray } from "./array-utils.js";
import { trimString } from "./file-utils.js";
import { IndexBitmap } from "../components/index-bitmap.js";

export function loadAsset(groupFile, assetName){
	assetName = trimString(assetName);
	const dataView = groupFile.getByName(assetName);
	if (dataView.byteLength === 0) return getNullAsset();

	if (assetName === "PALETTE.DAT") {
		return getPalette(dataView);
	}
	if (/(.*?)\.ART/.test(assetName)) {
		return getArtFile(groupFile, dataView);
	}
	return getNullAsset();
}

function getNullAsset() {
	const div = document.createElement("div");
	div.textContent = "Asset is null";
	return div;
}

export function getArtFile(groupFile, dataView){
	const assets = loadArtFile(dataView);
	const palettes = loadPalettes(groupFile.getByName("PALETTE.DAT"));

	const div = document.createElement("div");
	div.style = "height: 100%; overflow-y: auto";
	for(let i = 0; i < assets.length; i++){
		const header = document.createElement("h2");
		header.textContent = `Asset ${i}`;
		div.append(header);
		if(assets[i].length === 0) {
			div.append(getNullAsset());
		} else {
			const indexBitmap = new IndexBitmap();
			indexBitmap.setBitmap(assets[i]);
			indexBitmap.setPalette(palettes[0]);
			indexBitmap.height = assets[i].length;
			indexBitmap.width = assets[i][0].length;

			div.append(indexBitmap);
		}
	}

	return div;
}

export function getPalette(dataView){
	const paletteView = new PaletteView();
	paletteView.palettes = loadPalettes(dataView);

	return paletteView;
}

export function loadPalettes(dataView){
	const rootPalette = new Array(256);

	for (let i = 0; i < 256; i++) {
		const color = new Array(3);
		color[0] = dataView.getUint8(i * 3) * 4;
		color[1] = dataView.getUint8(i * 3 + 1) * 4;
		color[2] = dataView.getUint8(i * 3 + 2) * 4;
		rootPalette[i] = color;
	}

	return [rootPalette];
}

export function loadArtFile(asset){
	const dataView = asset instanceof DataView ? asset : new DataView(asset);

	const artVersion = dataView.getUint32(0, true); //should be 1
	const numTiles = dataView.getUint32(4, true); //not to be trusted apparently
	const localTileStart = dataView.getUint32(8, true);
	const localTileEnd = dataView.getUint32(12, true);

	const tileSizeX = new Array(localTileEnd - localTileStart + 1);
	const tileSizeY = new Array(localTileEnd - localTileStart + 1);

	let index = 16;

	for(let i = 0; i < tileSizeX.length; i++){
		tileSizeX[i] = dataView.getUint16(index, true);
		index += 2;
	}

	for (let i = 0; i < tileSizeY.length; i++) {
		tileSizeY[i] = dataView.getUint16(index, true);
		index += 2;
	}

	const picAnm = new Array(localTileEnd - localTileStart + 1);

	for (let i = 0; i < picAnm.length; i++) {
		picAnm[i] = dataView.getUint32(index, true);
		index += 4;
	}

	const assets = new Array(localTileEnd - localTileStart + 1);

	for(let i = 0; i < assets.length; i++){
		assets[i] = allocBlockArray(tileSizeX[i], tileSizeY[i]);
		for(let col = 0; col < tileSizeX[i]; col++){
			for(let row = 0; row < tileSizeY[i]; row++){
				assets[i][row][col] = dataView.getUint8(index++);
			}
		}
	}

	return assets;
}