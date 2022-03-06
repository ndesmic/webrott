import { allocBlockArray } from "./array-utils.js";

export function loadSprite(asset) {
	const dataView = asset instanceof DataView ? asset : new DataView(asset);

	const origSize = dataView.getUint16(0, true);
	const width = dataView.getUint16(2, true);
	const height = dataView.getUint16(4, true);
	const left = dataView.getUint16(6, true);
	const top = dataView.getUint16(8, true);
	const columnOffsets = new Array(width);

	for (let col = 0; col < width; col++) {
		columnOffsets[col] = dataView.getUint16(10 + (col * 2), true);
	}
	let index = 10 + (width * 2);

	const bitmap = allocBlockArray(width, height);

	for (let col = 0; col < width; col++) {
		while (true) {
			let rowStart = dataView.getUint8(index);
			index += 1;
			if (rowStart === 255) break;

			const pixelCount = dataView.getUint8(index);
			index += 1;

			//draw post spans
			for (let row = rowStart; row < rowStart + pixelCount; row++) {
				const palletIndex = dataView.getUint8(index);
				index += 1;

				bitmap[row][col] = palletIndex;
			}
		}
	}

	return bitmap;
}