export class Wad {
	constructor(arrayBuffer){
		this.arrayBuffer = arrayBuffer;
		this.dataView = new DataView(arrayBuffer);
		this.type = [
			this.dataView.getUint8(0),
			this.dataView.getUint8(1),
			this.dataView.getUint8(2),
			this.dataView.getUint8(3)
		].map(x => String.fromCharCode(x)).join("");
		this.numLumps = this.dataView.getInt32(4, true);
		this.infoTableOffset = this.dataView.getInt32(8, true);
		this.entries = [];
		let index = this.infoTableOffset;
		for(let i = 0; i< this.numLumps; i++){
			this.entries.push({
				offset: this.dataView.getInt32(index, true),
				size: this.dataView.getInt32(index + 4, true),
				name: [
					this.dataView.getUint8(index + 8),
					this.dataView.getUint8(index + 9),
					this.dataView.getUint8(index + 10),
					this.dataView.getUint8(index + 11),
					this.dataView.getUint8(index + 12),
					this.dataView.getUint8(index + 13),
					this.dataView.getUint8(index + 14),
					this.dataView.getUint8(index + 15)
				].map(x => String.fromCharCode(x)).join("")
			});
			index += 16;
		}
	}
	get(name){
		const entry = this.entries.find(e => e.name.trim() === name.trim());
		return new DataView(this.arrayBuffer, entry.offset, entry.size);
	}
}