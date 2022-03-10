export function multiTry(...functionsToTry) {
	let currentException;
	for (const func of functionsToTry) {
		try {
			return func();
		} catch (ex) {
			currentException = ex;
			continue;
		}
	}
	throw currentException;
}