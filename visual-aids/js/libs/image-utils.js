export function getpalette(paletteBuffer, length, scale = 1) {
	const palette = new Array(length);
	const dataView = new DataView(paletteBuffer);

	for (let i = 0; i < length; i++) {
		palette[i] = [
			dataView.getUint8((i * 3) + 0) * scale,
			dataView.getUint8((i * 3) + 1) * scale,
			dataView.getUint8((i * 3) + 2) * scale,
		];
	}
	return palette;
}

export function colorToHex(rgb) {
	const red = parseInt(rgb[0]).toString(16).padStart(2, "0")
	const green = parseInt(rgb[1]).toString(16).padStart(2, "0");
	const blue = parseInt(rgb[2]).toString(16).padStart(2, "0");
	return "#" + red + green + blue;
}

export function getTableImage(grid, palette, options = {}) {
	const showIndices = options.showIndices ?? true;
	const mapFunc = options.mapFunc ?? (x => x);

	const table = document.createElement("table");
	if (showIndices) {
		const thead = document.createElement("thead");
		for (let col = 0; col < grid[0].length + 1; col++) {
			const th = document.createElement("th");
			if (col !== 0) {
				th.textContent = col - 1;
			}
			thead.appendChild(th);
		}
		table.appendChild(thead);
	}
	for (let row = 0; row < grid.length; row++) {
		const tr = document.createElement("tr");

		if (showIndices) {
			for (let col = 0; col < grid[0].length + 1; col++) {
				let td = document.createElement("td");
				if (col === 0) {
					td.textContent = row;
					td.classList.add("index-col");
				} else {
					const color = palette[grid[row][col - 1]];
					td.style.backgroundColor = color !== undefined ? colorToHex(color) : "";
					td = mapFunc(td, row, col, color, grid[row][col - 1]);
				}
				tr.appendChild(td);
			}
			table.appendChild(tr);
		} else {
			for (let col = 0; col < grid[0].length; col++) {
				let td = document.createElement("td");
				const color = palette[grid[row][col]];
				td.style.backgroundColor = color !== undefined ? colorToHex(color) : "";
				td = mapFunc(td, row, col, color, grid[row][col - 1]);
				tr.appendChild(td);
			}
			table.appendChild(tr);
		}
	}

	return table;
}

export function getTablepalette(palette){
	const table = document.createElement("table");
	const width = 16;
	const height = palette.length / width;

	for(let row = 0; row < height; row++){
		const tr = document.createElement("tr");
		for(let col = 0; col < width; col++){
			const td = document.createElement("td");
			td.style.backgroundColor = colorToHex(palette[(row * width) + col]);
			tr.appendChild(td);
		}
		table.appendChild(tr);
	}

	return table;
}