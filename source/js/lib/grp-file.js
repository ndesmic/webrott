import { getString } from "./file-utils.js";

export class GrpFile {
	constructor(arrayBuffer) {
		this.arrayBuffer = arrayBuffer;
		this.dataView = new DataView(arrayBuffer);
		this.signature = getString(this.dataView, 0, 12);
		this.length = this.dataView.getUint32(12, true);

		this.entries = new Array(length);
		let index = 16;
		let runningSize = 0;
		let fileStartIndex = 16 + this.length * 16; //where the file data starts
		for (let i = 0; i < this.length; i++) {
			const size = this.dataView.getInt32(index + 12, true);
			this.entries.push({
				name: getString(this.dataView, index, 12),
				size,
				offset: fileStartIndex + runningSize
			});

			runningSize += size;
			index += 16;
		}
	}
	getByName(name) {
		name = name.padEnd(12, "\0");
		const entry = this.entries.find(e => e.name.trim() === name.trim());
		return entry
			? new DataView(this.arrayBuffer, entry.offset, entry.size)
			: null;
	}
}