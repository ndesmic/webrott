The WAD Format
==============

The first thing we'll do is try to understand the asset format.  This will be useful because if we can get the assets we can do all sorts of fun things with them.  Rise of the Triad uses the WAD format which was invented for Doom.  It contains many types of assets packed up into a single file, kinda like a primative zip archive or tarball file.  It consists of a bunch of "lumps" which represent an asset of some sort.  The overall structure is pretty simple and explained here: https://doomwiki.org/wiki/WAD.  The format is basically a header, a big block of binary data and then a table with names and such for the data at the end (we use the offset in the header to jump to the table).  The table has as many entries as their are lumps and each entry points to where in the file the data is located and its size.

We can easily build this part and it'll probably be easier to start with a small app so we can examine the contents.  We start with a file input.  When the "change" event is file input is triggered we just grab the first file (file inputs support multiple files if you really want to clean things up but we can ignore that) and load it.

```js
document.querySelector("input[type=file]").addEventListener("change", async e => {
	const file = e.target.files[0];
});
```

"Files" are blobs, we can't do much with them we need to convert them to something useful like a string or array buffer (serial chunk of bytes).  We can do this via a FileReader.  FileReader is an older API so it's a little awkward to use.  We first create a new one, then on the "load" we have to read file in the format we want.  There's also an "error" event if something goes wrong.  Finally, we feed in our file and ask it to convert it to one of the types it supports. Since we want binary data we'll choose an array buffer. To make this more convinient to use let's convert it to a promise-based API:

```js
function readFile(file){
	return new Promise((res, rej) => {
		const fileReader = new FileReader();
		fileReader.onload = e => res(e.target.result);
		fileReader.onerror = rej;
		fileReader.readAsArrayBuffer(file);
	});
}
```

We'll take the array buffer and give this to a `Wad` class which will handle getting data out of the wad.  This is pretty simple.  We index into the array buffer to get the bytes we want using the `DataVie`w API.  A `DataView` lets us read an array buffer in a structured way, you simply pass the array buffer with an offset and length (optional) to it.  Then we can call methods to read signed and unsigned integers as well as floats.  Each method has an optional boolean flag that tells whether the read is big-endian (default/false) or little-endian (true).  The WAD format (and most formats we'll encounter) use little endian integers so we need to set that flag.  Also note that there are no ways to extract strings so I pull out the 8-bit integers and then run them through `String.fromCharCode(x)` to convert them into ASCII chars (there should be no non-ASCII data), and then `join("")` to turn them into the strings you'd expect.

From here, it's as simple as following the spec, reading the values, and using them to index into things using the `DataView`.  The `wad-reader` custom element provides the file input, reads it, passes the array buffer to the Wad library and then lists out the entries.  The rest of the code is just boilerplate.

From here you can try reading some WADs like Doom shareware, Rise of the Triad shareware or any other custom and registered WADs you might have lying around and see what's in them.

Notes
-----
- WAD stands for "Where's All the Data"

Sources
-------
- https://doomwiki.org/wiki/WAD