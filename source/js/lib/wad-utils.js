export function getPaddedString(dataView, offset, length = 8){
	let str = "";
	for(let i = 0; i < length; i++){
		const code = dataView.getUint8(offset + i);
		str += String.fromCharCode(code);
	}
	return str;
}