import { allocBlockArray } from "./array-utils.js";

export function loadImage(asset){
	const dataView = asset instanceof DataView ? asset : new DataView(asset);

	const width = dataView.getUint16(0, true);
	const height = dataView.getUint16(2, true);
	const left = dataView.getUint16(4, true);
	const top = dataView.getUint16(6, true);
	const columnOffsets = new Array(width);

	for (let col = 0; col < width; col++) {
		columnOffsets[col] = dataView.getUint32(8 + (col * 4), true);
	}
	let index = 8 + (width * 4);

	const bitmap = allocBlockArray(width, height);

	for (let col = 0; col < width; col++) {
		while (true) {
			const rowStart = dataView.getUint8(index);
			index += 1;
			if (rowStart === 255) break;

			const pixelCount = dataView.getUint8(index);
			index += 1;

			//advance one more byte because of unused padding
			index += 1;

			//draw post spans
			for (let row = rowStart; row < rowStart + pixelCount; row++) {
				const palletIndex = dataView.getUint8(index);
				index += 1;

				bitmap[row][col] = palletIndex;
			}

			index += 1; //advance one more byte because of unused padding
		}
	}

	return [bitmap, height, width]
}