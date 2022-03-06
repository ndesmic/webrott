export function renderIndexedBitmap(bitmap, pallet){
	const height = bitmap.length;
	const width = bitmap[0].length;

	const canvas = document.createElement("canvas");
	canvas.height = height;
	canvas.width = width;
	const context = canvas.getContext("2d");
	const imageData = context.getImageData(0, 0, width, height);

	for (let col = 0; col < width; col++) {
		for (let row = 0; row < height; row++) {
			const pixelOffset = (row * width * 4) + (col * 4);
			const color = pallet[bitmap[row][col]];

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

export function renderTableMap(map, wallBitmaps, pallet){
	const height = map[0].length;
	const width = map[0][0].length;
	const wallCount = wallBitmaps?.length;
	const table = document.createElement("table");

	for(let row = 0; row < height; row++){
		const tr = document.createElement("tr");

		for(let col = 0; col < width; col++){
			const td = document.createElement("td");
			const value = map[0][row][col];
			td.dataset.l1value = value;
			td.dataset.x = col;
			td.dataset.y = row;

			if(!wallBitmaps || !pallet){
				td.textContent = value;
				if(value < 64){
					td.style.backgroundColor = "#000";
					td.style.color = "#fff";
				}
			} else {
				if(value < 64){ //wall
					td.appendChild(renderIndexedBitmap(wallBitmaps[(value - 1) * 2], pallet));
				} else if (value === 90) { //door e/w
					td.appendChild(renderIndexedBitmap(wallBitmaps[wallCount - 7], pallet)); 
				} else if(value === 91){  //door n/s
					td.appendChild(renderIndexedBitmap(wallBitmaps[wallCount - 8], pallet));
				} else if (value === 92 || value === 94) { //gold / silver door n/s
					td.appendChild(renderIndexedBitmap(wallBitmaps[wallCount - 2], pallet));
				} else if (value === 93 || value === 95) { //gold / silver door e/w
					td.appendChild(renderIndexedBitmap(wallBitmaps[wallCount], pallet));
				} else if (value === 100) { //elevator door n/s
					td.appendChild(renderIndexedBitmap(wallBitmaps[wallCount - 3], pallet));
				} else if (value === 101) { //elevator door e/w
					td.appendChild(renderIndexedBitmap(wallBitmaps[wallCount - 4], pallet));
				}
			}
			tr.appendChild(td);
		}

		table.appendChild(tr);
	}

	return table;
}