export function writeBlockSequential(squareArray, index, value) {
	try {
		const row = Math.floor(index / squareArray.length);
		const col = index % squareArray.length;
		squareArray[row][col] = value;
	} catch(ex){
		console.log(ex);
	}
}

export function allocSquareBlock(size) {
	const array = new Array(size);
	for (let i = 0; i < size; i++) {
		array[i] = new Array(size);
	}
	return array;
}

export function forEachBlock(squareArray, callback){
	for(let row = 0; row < squareArray.length; row++){
		for(let col = 0; col < squareArray.length; col++){
			callback(squareArray[row][col], row, col);
		}
	}
}