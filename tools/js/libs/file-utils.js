export function readFile(file) {
	return new Promise((res, rej) => {
		const fileReader = new FileReader();
		fileReader.onload = e => res(e.target.result);
		fileReader.onerror = rej;
		fileReader.readAsArrayBuffer(file);
	});
}

export function getName(filename) {
	const extSplit = filename.split(".");
	const path = extSplit[extSplit.length - 2];
	const pathSplit = path.split("/");
	return pathSplit[pathSplit.length - 1].toLowerCase();
}

export function getArray16(dataView, offset, length, littleEndian = true) {
	const arr = new Array(length);
	for (let i = 0; i < length; i++) {
		const value = dataView.getUint16(offset + (i * 2), littleEndian);
		arr[i] = value;
	}
	return arr;
}

export function getArray8(dataView, offset, length, littleEndian = true) {
	const arr = new Array(length);
	for (let i = 0; i < length; i++) {
		const value = dataView.getUint8(offset + (i * 2), littleEndian);
		arr[i] = value;
	}
	return arr;
}

export function getString(dataView, offset, length) {
	let str = "";
	for (let i = 0; i < length; i++) {
		const code = dataView.getUint8(offset + i);
		str += String.fromCharCode(code);
	}
	return str;
}

export function download(blob, name){
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name ?? "file";
	a.click();
	URL.revokeObjectURL(blob);
}