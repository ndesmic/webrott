export function readFile(file) {
	return new Promise((res, rej) => {
		const fileReader = new FileReader();
		fileReader.onload = e => res(e.target.result);
		fileReader.onerror = rej;
		fileReader.readAsArrayBuffer(file);
	});
}

export function getExtension(filename) {
	const split = filename.split(".");
	return split[split.length - 1].toLowerCase();
}

export function getName(filename) {
	const extSplit = filename.split(".");
	const path = extSplit[extSplit.length - 2];
	const pathSplit = path.split("/");
	return pathSplit[pathSplit.length - 1].toLowerCase();
}

export function getString(dataView, offset, length) {
	let str = "";
	for (let i = 0; i < length; i++) {
		const code = dataView.getUint8(offset + i);
		str += String.fromCharCode(code);
	}
	return str;
}

export function trimString(str) {
	return str.replace(/\0/g, "");
}

export function unCarmack(arraybuffer, byteLength) {
	const wordLength = Math.floor(byteLength / 2);
	const result = new Uint16Array(wordLength);
	const dataView = new DataView(arraybuffer);
	let inputByteIndex = 0;
	let outputWordIndex = 0;

	while (outputWordIndex < wordLength) {
		let word;
		try {
			word = dataView.getUint16(inputByteIndex, true);
		} catch(ex){
			return result.buffer; //bail out!
		}
		inputByteIndex += 2;
		const tag = word >> 8;

		if (tag === 0xa7) { //Near, the offset is 8-bits
			const count = word & 0xff;

			if (count === 0) { //repeat 0 means the tag bytes was actually supposed to be data with high byte 0xa7, read one more byte and that becomes the low byte of the word
				const low = dataView.getUint8(inputByteIndex);
				inputByteIndex += 1;

				result[outputWordIndex] = word | low;  //add the low part back to word
				outputWordIndex += 1;
			} else {
				const offset = dataView.getUint8(inputByteIndex);
				inputByteIndex += 1;

				for (let i = 0; i < count; i++) {
					const val = result[outputWordIndex - offset];
					result[outputWordIndex] = val;
					outputWordIndex += 1;
				}
			}
		} else if (tag === 0xa8) { //Far, the offset is 16-bits
			const count = word & 0xff;

			if (count === 0) { //repeat 0 means the tag bytes was actually supposed to be data, the first byte will be the third value
				const low = dataView.getUint8(inputByteIndex);
				inputByteIndex += 1;

				result[outputWordIndex] = word | low;  //add the low part back to word
				outputWordIndex += 1;
			} else {
				const offset = dataView.getUint16(inputByteIndex, true);
				inputByteIndex += 2;

				for (let i = 0; i < count; i++) {
					const val = result[offset + i];
					result[outputWordIndex] = val;
					outputWordIndex += 1;
				}
			}
		} else { //no tag so write word
			result[outputWordIndex] = word;
			outputWordIndex += 1;
		}
	}

	return result.buffer;
}

export function unRelew(arraybuffer, byteLength, relwTag){
	const wordLength = Math.floor(byteLength / 2);
	const result = new Uint16Array(wordLength);
	const dataView = new DataView(arraybuffer);
	let inputByteIndex = 0;
	let outputWordIndex = 0;

	while (outputWordIndex < wordLength) {
		let tag;
		try {
			tag = dataView.getUint16(inputByteIndex, true);
		} catch(ex){
			return result.buffer;
		}
		inputByteIndex += 2;

		if (tag === relwTag) { //compressed data
			const count = dataView.getUint16(inputByteIndex, true);
			inputByteIndex += 2;
			const value = dataView.getUint16(inputByteIndex, true);
			inputByteIndex += 2;

			for (let i = 0; i < count; i++) {
				result[outputWordIndex] = value;
				outputWordIndex += 1;
			}
		} else { //uncompressed data
			result[outputWordIndex] = tag;
			outputWordIndex += 1;
		}
	}

	return result.buffer;
}