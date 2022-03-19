export function forEachLumpInSection(wad, section, callback) {
	let isSection = false;
	const sectionMatcher = new RegExp(`${section}STA?RT`);
	const contentMatcher = new RegExp(`^${section}`);

	for (let i = 0; i < wad.entries.length; i++) {
		const entry = wad.entries[i];

		if (sectionMatcher.test(entry.name)) isSection = true;
		else if (entry.name === `${section}STOP` || (entry.size === 0 && !contentMatcher.test(entry.name))) { //hack because there are 0 length walls
			if(isSection) break;
			continue;
		}
		else if (isSection) callback(entry);
	}
}
