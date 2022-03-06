import { allocBlockArray } from "./array-utils.js";

export function loadSprite(asset) {
	const dataView = asset instanceof DataView ? asset : new DataView(asset);

	let index = 0;
	const left = dataView.getUint16(index, true);
	index += 2;
	const right = dataView.getInt16(index, true);
	index += 2;

	const bitmap = allocBlockArray(64, 64);

	const columnOffsets = [];
	for (let col = left; col <= right; col++) {
		columnOffsets[col] = dataView.getUint16(index, true);
		index += 2;
	}

	//index is now pointing at pixelPool

	for (let col = left; col < right; col++) {
		let escape = 0;
		let offsetIndex = 0;
		while (true) {
			//we're reading 6 bytes and skipping the middle 2 bytes every time
			const end = dataView.getUint16(columnOffsets[col] + offsetIndex, true) / 2;
			if (end === 0) break;
			const start = dataView.getUint16(columnOffsets[col] + offsetIndex + 4, true) / 2;
			offsetIndex += 6;
			for (let row = start; row < end; row++) {
				bitmap[row][col] = dataView.getUint8(index);
				index += 1;
			}
			if (escape > 64) throw new Error(`Loop is not terminating. Column: ${col}`);
			escape++;
		}
	}

	return bitmap;
}