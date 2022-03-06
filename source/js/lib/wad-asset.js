export function loadAsset(wad, name){
	const dataView = wad.get(name);
	if (/WALL/.test(name)) {
		return getWall(dataView);
	}
	if(/COLORMAP/.test(name)){
		return getColorMap(dataView);
	}
}



function getWall(dataView){
	const canvas = document.createElement("canvas");
	canvas.height = 64;
	canvas.width = 64;
	const context = canvas.getContext("2d");
	const imageData = context.getImageData(0, 0, 64, 64);

	for(let col = 0; col < 64; col++){
		for(let row = 0; row < 64; row++){
			const pixelOffset = (col * 64 * 4) + (row * 4);
			imageData.data[pixelOffset] = dataView.getUint8((row * 64) + col); //red
			imageData.data[pixelOffset + 1] = 0; //green
			imageData.data[pixelOffset + 2] = 0; //blue
			imageData.data[pixelOffset + 3] = 255
		}
	}

	context.putImageData(imageData, 0, 0);

	return canvas;
}