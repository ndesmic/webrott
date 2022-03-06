export function writeBlockSequential(squareArray, index, value) {
	try {
		const row = Math.floor(index / squareArray.length);
		const col = index % squareArray.length;
		squareArray[row][col] = value;
	} catch(ex){
		console.log(ex);
	}
}

export function allocBlockArray(width, height, defaultValue) {
	const array = new Array(height);
	for (let i = 0; i < height; i++) {
		array[i] = new Array(width);
		if (defaultValue !== undefined) array[i].fill(defaultValue);
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