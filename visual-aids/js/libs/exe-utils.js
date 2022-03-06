import { getString } from "./file-utils.js"

export function readDosHeader(dataView){
	return {
		signature: getString(dataView, 0, 2),
		lastSize: dataView.getUint16(2, true), //bytes on last block/page of file (0 means all, not all 512 may be used)
		countOfBlocks: dataView.getUint16(4, true), //count of blocks/pages that are part of the EXE
		countOfRelocations: dataView.getUint16(6, true), //count of relocation entries
		headerSize: dataView.getUint16(8, true), //header size in paragraphs
		minAlloc: dataView.getUint16(10, true), //minimum extra paragraphs needed
		maxAlloc: dataView.getUint16(12, true), //maximum extra paragraphs needed
		stackSegment: dataView.getUint16(14, true), //initial (relative) SS value (used to set the SS register)
		stackPointer: dataView.getUint16(16, true), //initial SP value 
		checksum: dataView.getUint16(18, true), //Checksum (usually not used)
		instructionPointer: dataView.getUint16(20, true), //initial IP value
		codeSegment: dataView.getUint16(22, true), //initial (relative) CS value
		relocationTableOffset: dataView.getUint16(24, true), //address of relocation table
		overlayIndex: dataView.getUint16(26, true), //overlay index
	};
}

export function dosHeaderToUint16Array(dosHeader){
	const array = new Uint16Array(14);

	array.set([dosHeader.signature], 0); 
	array.set([dosHeader.lastSize], 1);
	array.set([dosHeader.countOfBlocks], 2);
	array.set([dosHeader.countOfRelocations], 3);
	array.set([dosHeader.headerSize], 4);
	array.set([dosHeader.minAlloc], 5);
	array.set([dosHeader.maxAlloc], 6);
	array.set([dosHeader.stackSegment], 7);
	array.set([dosHeader.stackPointer], 8);
	array.set([dosHeader.checksum], 9);
	array.set([dosHeader.instructionPointer], 10);
	array.set([dosHeader.codeSegment], 11);
	array.set([dosHeader.relocationTableOffset], 12);
	array.set([dosHeader.overlayIndex], 13);

	return array;
}