Webrott
=======

Welcome to the new and improved Webrott project!

Webrott is my first attempt at source porting an old game.  I have no real expectations of finishing but I'd like to explore and learn about it.  To that end, it's split up like a series of blog posts where each good working session has some learnings and updated code.

Rise of the Triad (ROTT) was released in 1994 by Apogee.  It's a very interesting game especially for the time but not very well known as it didn't look or play as well as Doom but had many unique ideas like multiple playable characters, rudimentary room-over-room, and a bizarre sense of humor.  You take the role of a strike team who must infiltrate an island full of cultists and robots to take down their leader, the evil El Oscuro.  It runs on a updated version of the Wolfenstein 3D engine with a couple of things stolen from the Doom engine (making it more manageable for me because documentation is more plentiful for those).  Interestingly, it started as a Wolfenstien 3d sequel Wolfenstien II: Rise of the Triad before Id decided to pull the license from Apogee.  The engine was released as open source so I can probe it. My C and x86 assembly are weak and all I know about how the inner workings of those old computers I learned from Fabien Sanglard's excellent [Game Engine Black Book](https://www.amazon.com/Game-Engine-Black-Book-DOOM/dp/1099819776) series, in fact that's part of my inspiration to try.

Anyhoo, there aren't any good ways to play it these days. The best source port, Winrott, is very buggy so you're pretty much stuck with DOSBOX and that's just ugly.  Maybe someday this could be something, or at least more documentation for others.  Also, since it shares a lot of code with other games of the era (like Doom), my plan is to explore those as well because it's interesting!

By the way, I've added some shareware/freeware asset files in the repo because they make for good testing.  Please play them and buy the retail games!

You can find the source code here: https://github.com/videogamepreservation/rott

Table of Contents
-----------------

- [Chapter 1 - The Wad Format](1-wad.md) (Doom, ROTT)
- [Chapter 2 - Reading Walls: A First Attempt](2-walls.md) (Doom, ROTT)
- [Chapter 3 - Reading palettes](3-palettes.md) (Doom, ROTT)
- [Chapter 4 - Reading Walls 2: We Have Color](4-walls2.md) (Doom, ROTT)
- [Chapter 5 - Reading Sprites](5-sprites.md) (Doom, ROTT)
- [Chapter 6 - Reading Maps](6-maps.md) (ROTT)
- [Chapter 7 - Reading Maps 2: Wolfenstien](7-maps2.md) (Wolfenstien 3D, ROTT)
- [Chapter 8 - Reading Maps 3: Carmack Compression](8-maps3.md) (Wolfenstien 3D)
- [Chapter 9 - Reading Walls 3: Wolfenstien](9-walls3.md) (Wolfenstien 3D)
- [Chapter 10 - Reading Sprites 2: Wolfenstien](10-sprites2.md) (Wolfenstien 3D)
- [Chapter 11 - Reading Maps 4: Putting it together](11-maps4.md) (Wolfenstien 3D)
- [Chapter 12 - Performance 1: Map Views](12-perf.md) (Wolfenstien 3D)
- [Chapter 13 - EXE Compression](13-compression.md) (Blake Stone: Aliens of Gold)
- [Chapter 14 - Reading palettes 2: EXE Compression, Binary Diffing, and palette Sniffing](14-palettes2.md) (Blake Stone: Aliens of Gold)
- [Chapter 15 - Reading Maps 5: ROTT Textures](15-maps5.md) (Blake Stone: AOG, ROTT)
- [Chapter 16 - Masked Walls](16-masked-walls.md) (ROTT)
- [Chapter 17 - Masked Walls 2](17-masked-walls2.md) (ROTT)
- [Chapter 18 - BUILD-engine assets](18-duke-assets.md) (Duke Nukem 3D)

Working with the code
---------------------

I have newly rebuilt the webrott repo to turn it into a bunch of tagged git versions.  I originally avoided this so it was easy to reference but with 17+ chapters it was getting too unweldly to duplicate the code and being able to view the code changes as a diff is very handy.  Each new chapter will be associated with a git tag in order to view the source code. There are also folders with visual aids, data and shared files like CSS styles.

To run the project, simply run `npm start` (you must install node: https://nodejs.org/en/) in the root directory using the terminal. Node is only required to run the basic dev server, and all it does is serve static files to the web browser on localhost. You can use your own static server if you have a different one you like. I'm not going to use a build process or framework, everything is vanilla js, but I will leverage web components so you may want to brush up on those if you are unfamilar.  I also will not be using existing libraries or transpiling code, everything is written from scratch using VSCode and debugged in Chrome (browser support is not a priority but it's very unlikely I'll utilize APIs that don't have wide support). I generally won't dive as deep into the js parts unless they are particularly interesting, so definitely checkout MDN to understand how some of these APIs work. I'm also going for readability over performance because this is a learning exercise. 

Anyway, once the file server is running, just navigate to the html file you want.

A Native Implementation
-----------------------

I have a sister project called `rustrott` which will deal with native code and perhaps approach things in a different way.  Hopefully, spirit-willing, they will meet in the middle one day with WASM.  While it is not likely to receive as much attention from me, feel free to keep an eye on it.

https://github.com/ndesmic/rustrott


Sources
-------

- Rise of the Triad was almost a Wolfenstien sequel: https://www.dualshockers.com/rise-of-the-triad-wolfenstein-sequel-pc/
- MDN: https://developer.mozilla.org/en-US/docs/Web