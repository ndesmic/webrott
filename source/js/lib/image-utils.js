export function renderIndexedBitmap(bitmap, palette, offScreen = false){
	if(bitmap == null) return null;
	const height = bitmap.length;
	const width = bitmap[0].length;

	let canvas;
	if(offScreen){
		canvas = new OffscreenCanvas(width, height);
	} else {
		canvas = document.createElement("canvas");
		canvas.height = height;
		canvas.width = width;
	}

	const context = canvas.getContext("2d");
	const imageData = context.getImageData(0, 0, width, height);

	for (let col = 0; col < width; col++) {
		for (let row = 0; row < height; row++) {
			const pixelOffset = (row * width * 4) + (col * 4);
			const color = palette[bitmap[row][col]];

			if(!color){
				imageData.data[pixelOffset] = 0;
				imageData.data[pixelOffset + 1] = 0;
				imageData.data[pixelOffset + 2] = 0;
				imageData.data[pixelOffset + 3] = 0;
			} else {
				imageData.data[pixelOffset] = color[0]; //red
				imageData.data[pixelOffset + 1] = color[1]; //green
				imageData.data[pixelOffset + 2] = color[2]; //blue
				imageData.data[pixelOffset + 3] = 255
			}
		}
	}

	context.putImageData(imageData, 0, 0);
	return canvas;
}

export function imageToCanvas(image){
	const canvas = document.createElement("canvas");
	canvas.width = image.width;
	canvas.height = image.height;
	const ctx = canvas.getContext("2d");
	ctx.drawImage(image, 0, 0);
	return canvas;
}

export function renderTiledMap(map, tiles, transforms, tileSize, offScreen = true){
	const height = map.length;
	const width = map[0].length;
	const pixelHeight = height * tileSize;
	const pixelWidth = width * tileSize;
	const halfTile = tileSize / 2;

	let canvas;
	if (offScreen) {
		canvas = new OffscreenCanvas(pixelWidth, pixelHeight);
	} else {
		canvas = document.createElement("canvas");
		canvas.height = pixelHeight;
		canvas.width = pixelWidth;
	}

	const context = canvas.getContext("2d");

	for (let col = 0; col < width; col++) {
		for (let row = 0; row < height; row++) {
			const tile = tiles[map[row][col]];

			if (tile) {
				if (transforms && transforms[row][col] != undefined){

					context.save();
					context.translate(col * tileSize, row * tileSize);

					switch (transforms[row][col]){
						case 0: {
							context.drawImage(tile, col * tileSize, row * tileSize);
							break;
						}
						case 1: {
							context.translate(halfTile, halfTile);
							context.rotate(Math.PI * 0.5);
							context.translate(-halfTile, -halfTile);
							break;
						}
						case 2: {
							context.translate(halfTile, halfTile);
							context.rotate(Math.PI);
							context.translate(-halfTile, -halfTile);
							break;
						}
						case 3: {
							context.translate(halfTile, halfTile);
							context.rotate(Math.PI * 1.5);
							context.translate(-halfTile, -halfTile);
							break;
						}
						case 4: {
							context.translate(tileSize, 0);
							context.scale(-1, 1);
							break;
						}
						case 5: {
							context.translate(0, tileSize);
							context.scale(1, -1);
							break;
						}
					}

					context.drawImage(tile, 0, 0);
					context.restore();
				} else {
					context.drawImage(tile, col * tileSize, row * tileSize);
				}
			}
		}
	}

	return canvas;
}