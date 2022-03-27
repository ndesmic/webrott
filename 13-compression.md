EXE Compression
===============

Note: Thgis time we'll be looking at code in [../tools/unlzwexe.html](unlzw.html) instead of the source folder.

I did a little exploration to see what happens when I try to add Blake Stone: Aliens of Gold assets to the asset reader and it turned out to be a rather large rabbit hole.  When you try to add them they do work, well, mostly.  Blake Stone does not use the same palette as Wolfenstien so everything looks messed up:

![Blake Stone sector patrol guard with wrong colors](images/chapter13/blake-wrong-palette.png)

Ok, so this is easy enough to fix right?  Well no.  Before when we extracted the Wolfenstien palette (or at least one of them, still not sure about the rest) we had access to `GAMEPAL.obj` in the source code and some handy documentation on where the palette data started.  Sadly, we don't have this for Blake Stone.  So what do we do?

- We could totally cheat and just steal the extracted palette from someone else's source port.
- We could painfully reconstruct it using screenshots taken from DOSBOX etc.
- We can try to extract the palette from compiled source.

The first is always an option but not really in the spirit of the project.  However, we can use some pre-knowledge of what the data looks like to make our job easier.  Two is more of a last resort.

The first stab at the problem was seeing if we can find some patterns in the data of the `BLAKE_AOG.exe`.  We know that black and grays are part of the palette and we know it should be in the same format as in Wolfenstien (64 value scaled RGB).  Using a hex editor I scanned the exe for patterns like 0,0,0 (black) or other sets of 3 repeating bytes (gray).  This turned out to be fruitless as no relevant matches were coming up.  As it turns out the exe is compressed.  Fortunately, some research revealed how it was compressed.  It was common for early Id and Apogee games to use a utility called LZEXE.  This compresses the exe and lets it decompress itself when run.  There's a separate tool called UNLZEXE (not by the same author) that can be used to decompress it.  Even better it was maintained enough that it's still usable today and there's some source code for it (the bad part is it's early 90s C, lots of globals, lots of hyper abbreviated variables, and variable reuse).

The first step was to see if indeed the EXE was compressed with this tool and if UNLZEXE worked.  It's easy enough to run `BLAKE_AOG.exe` through UNLZEXE and it didn't complain.  Next, we load it up in DOSBOX to see if it actually boots.  It does!  This is good because it confirms what we read but more importantly we have a decompressed exe.

...But we can't stop there.

Part of the rules were not using 3rd party native tools.  This is specifically because hunting down long abandoned tools hoping for them to work on my platform of choice is not something I want others to go through.  We're going to remake this tool web native and we're going to try as best we can to document it.  The downside is that there's no existing documentation, few comments and the code is dense.

I tried pushing through just using the source I had but it proved insufficient to really explain what the heck all these values meant.  To do so we need to understand a bit about how a (DOS) EXE works.

First is a header:

```js
const dosHeader = {
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
```

There's already a lot of vocabulary here:

- A `block` or `page` is a 512 byte chunk of data
- A `paragraph` is a 16 byte chunk of data
- `SS` register is the stack segment which is an additional (4 bit) value to help address more than (2^16) bytes of RAM. (SS * 16 + SP) is the address of the top of the stack in memory.
- `SP` register is the stack pointer, it points to the top of the stack.
- `IP` register is the instruction pointer, points to the current instruction
- `CS` register is the code segment, a 16-bit register that "pages" the IP so you can have more than (2^16) instructions. (CS * 16 + IP) is the address of the current instruction.
- `overlay` is like a traditional memory page.  Overlays get swapped in and out from disk to overcome memory constraints.  This is usually zero meaning it's the main segment/program.
- `relocation table` is a table that points to all the static addresses in the instructions to execute.  Since the program can be loaded anywhere in memory, static addresses need to be updated with an offset.  Entries in the table are made up of 2 16-bit values and there are `countOfRelocations` many of them, the first is the offset and the second is the segment where the instruction to update is located.  If we were running this, we would need to jump to each location and add the memory offset from which the program started to the value there.

Immediately following is the expansion header:

```js
const expansionHeader = {
	version: getString(dataView, 28, 4), //
	oemId: dataView.getUint16(32, true), //OEM identifier
	oemInfo: dataView.getUint16(34, true), //OEM info
	reserved2: getArray16(dataView, 36, 10), //reserved
	peOffset: dataView.getUint32(56, true) //offset to Portable Executable header
};
```

- `version` here is what is usually documented as "reserved" space.  `LZEXE` puts it's version signature here (either `LZ90` or `LZ91`).
- `OEM` or Original Equipment Manufacturer.  This is some hardware-centric metadata, at the time there could be hardware specific stuff going on.
- `peOffset` the offset to the "portable executable" part of the EXE.  This is wraps up the executable code and lets the OS know how to run it.  This value is often called `e_lfanew`.  I haven't figured out why.

First we read the file and see if it is infact compressed by verifying header data is consistent with that of an LZEXE compressed executable, easy enough.  Then things get a little interesting.  We need to jump to where the data is and read another header.  In the source code we see `fpos=(long)(ihead[0x0b]+ihead[4])<<4`.  This translated is `(dosHeader.codeSegment + dosHeader.headerSize) * 16`.  My hazy understanding would be that the code segment offset (remember, it's multiplied by 16 and added to the instruction pointer which should start at 0) is where the actual code starts.  However, this offset only applies after reading the header rather than from 0 (I guess because you need to read the CS value before you jump? IDK). `headerSize` is measured in paragraphs so we multiply that by 16 too.

The relocation table
--------------------

We read one byte from the buffer, this is the "span".
- If it's a 0, read 16-bits, this is the new span
	- If the new span is 0 we increment the segment by 0x0fff.  Code Segments are 20-bit addressable values, so this indicates we need to advance to the next segment.
	- If the new span is 1 then we're done.
- Add span to offset (offset starts at 0)
- The top 4-bits of the offset are added to the segment
- The true offset is the bottom 4-bits of the offset value
- Write the offset then the segment as 16-bit values

Then pad to align with the page boundary.

Especially without a lot of knowledge in this area it's hard to tell what it's trying to do but it's clearly compressing the table. Beneath the table is the compressed source. When decompressing the shareware `BLAKE_AOG.exe`, the resulting output relocation table ends at byte 14999 and 360 bytes of padding are added afterward to align to the page boundary. So 15360 is where the the code will start.

Unpacking
---------

Unpacking is a little more intuitive as it's similar to the Carmack encoding we saw earlier.  We read in 16 bits which happens to be a bunch of control instructions for how to read the next few bytes.  In the source code there's a buffer that fills up and then gets written out when it hits 0x4000 (16384) bytes, we don't need to maintain that since we're just going to buffer the whole thing (streaming to files isn't something web does yet anyway at the time of writing).

We read one bit from the buffer.
- If it's 1, then we write the next byte to the destination file
- Read another bit, 
	- if it's 0, we read the next 2 bits and add 2, this will be the length (the smallest length is 2), and then we read the next byte and add 0xff.  This value is *signed* so it will always be negative as the highest bit is on.  To get the true value we need to take the twos compliment (there's probably a simplification here but I didn't think of it). This is the span, or the offset from the front of the output buffer.
	- otherwise we read the next byte, this is the span.  Then we read the next byte, this is the length.  In this case we're offsetting more than 256 so the top 5 bits of length appended as the high bits on span creating a 21-bit value. In the source you'll see them use `~0x07` which is fancy way to say `0b11111111_11111000` (248) as it's a bitwise not of `0x07` `0b00000000_00000111`.  This is OR'd with `0xe000` which is a 16-bit value where the last 3 bits are on.  So we effectively make a 16-bit negative number and we'll need to take the two's compliment to get it back to normal.  Then we take the lower 3-bits of length and add 2 to them (why exactly this + 2 exists is not clear to me).  
		- If the length (before adding 2) was 0, then we read an entire byte and that becomes the length.  This means the shortest span length is 3. 
			- If the second length byte is read and is 0 we're done, if it's 1 then we start the loop again, otherwise we add 1 (again the extra adds to length are weird to me).
- Then we take the span as an offset from the end of the output and read `length` bytes back on to the front of it.

After this it's just a matter of fixing up the headers with the correct values.  Well, kinda, I didn't actually get it working completely and the debugging got really tedius so we'll need to come up with a plan for that.

Process
-------
I had to rewrite the code several times as I slowly decoded what was going on.  If this seems dense it's because it is.

The first pass was just copying the code, almost verbatum from the C source.  By using a hex editor with the decompressed source I could start comparing values to make sure things were lining up.  This left a lot of unknowns as there's lots of bit shifting, bitwise NOTs and other not-so-obvious parts.  Then I started researching the EXE header and various parts to better understand what they meant.  This allowed me to match up values to what they mean and better understand how they were being manipulated.  Once I had a better intuition I could rewrite that part to be a little more js-centric.  Of course not all of it will be.  I still pass in the output header as a reference which is not very javascripty but it's certainly makes things easy without a major rearchitecture.

The process was painstaking but ultimately rewarding even if I still only understand about 80% of it.

Souces
------

- https://github.com/mywave82/unlzexe/blob/master/unlzexe.c
- http://www.shikadi.net/moddingwiki/LZW_Compression
- https://www.pcorner.com/list/UTILITY/UNLZEXE5.ZIP/UNLZEXE.C/
- https://en.wikibooks.org/wiki/X86_Disassembly/Windows_Executable_Files
- https://stackoverflow.com/questions/42944853/dos-header-presented-as-a-c-data-structure
- http://www.delorie.com/djgpp/doc/exe/
- https://www.digitalmars.com/ctg/vcm.html
- http://www.techhelpmanual.com/354-exe_file_header_layout.html
- http://www.tavi.co.uk/phobos/exeformat.html