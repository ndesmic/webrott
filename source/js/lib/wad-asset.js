export function loadAsset(wad, name){
	const dataView = wad.get(name);
	if (/WALL/.test(name)) {
		return getWall(dataView);
	}
	if(/COLORMAP/.test(name)){
		return getColorMap(wad, dataView);
	}
	if(/PLAYPAL/.test(name)){
		return getPlayPal(dataView);
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

function getPlayPal(dataView){
	const mapCount = dataView.byteLength / 768;
	const ul = document.createElement("ul");

	for(let map = 0; map < mapCount; map++){
		const table = document.createElement("table");
		table.classList.add("pallet");
		const li = document.createElement("li");
		const h2 = document.createElement("h2");
		h2.textContent = `Pallet ${map}`;
		
		for(let row = 0; row < 16; row++){
			const tableRow = document.createElement("tr");

			for(let col = 0; col < 16; col++){
				const tableCell = document.createElement("td");

				const offset = (map * 768) + (row * 16 * 3) + (col * 3);
				const red = dataView.getUint8(offset);
				const green = dataView.getUint8(offset + 1);
				const blue = dataView.getUint8(offset + 2);

				tableCell.style.backgroundColor = `rgb(${red},${green},${blue})`;
				tableRow.appendChild(tableCell);
			}
			table.appendChild(tableRow);
		}
		li.appendChild(h2)
		li.appendChild(table);
		ul.appendChild(li);
	}

	return ul;
}

function getColorMap(wad, dataView){
	//get base pallet
	const playPal = wad.get("PLAYPAL")
	const mapCount = dataView.byteLength / 256;
	const ul = document.createElement("ul");

	for(let map = 0; map < mapCount; map++){
		const li = document.createElement("li");
		const table = document.createElement("table");
		table.classList.add("pallet");
		const h2 = document.createElement("h2");
		h2.textContent = `Pallet ${map}`;

		for (let row = 0; row < 16; row++) {
			const tableRow = document.createElement("tr");

			for (let col = 0; col < 16; col++) {
				const tableCell = document.createElement("td");

				const playPalIndex = dataView.getUint8((map * 256) + (row * 16) + col) * 3;
				const red = playPal.getUint8(playPalIndex);
				const green = playPal.getUint8(playPalIndex + 1);
				const blue = playPal.getUint8(playPalIndex + 2);

				tableCell.style.backgroundColor = `rgb(${red},${green},${blue})`;
				tableRow.appendChild(tableCell);
			}
			table.appendChild(tableRow);
		}

		li.appendChild(h2)
		li.appendChild(table);
		ul.appendChild(li);
	}

	return ul;
}