export function readFile(file) {
	return new Promise((res, rej) => {
		const fileReader = new FileReader();
		fileReader.onload = e => res(e.target.result);
		fileReader.onerror = rej;
		fileReader.readAsArrayBuffer(file);
	});
}

export function getExtension(filename){
	const split = filename.split(".");
	return split[split.length - 1].toLowerCase();
}

export function getName(filename){
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

export function trimString(str){
	return str.replace(/\0/g, "");
}