export function allocBlockArray(width, height, defaultValue) {
	const array = new Array(height);
	for (let i = 0; i < height; i++) {
		array[i] = new Array(width);
		if(defaultValue !== undefined) array[i].fill(defaultValue);
	}
	return array;
}