Dungeon
=======

This is 3d first person game prototype with a level editor.
The main design guideline is sacrificing artistic liberties for quickness of content creation.

It works on Chrome and Firefox (be sure to use latest versions), but Firefox has
bad performance. You probably have bad performance anyway, unless you have a good GPU.

Here's a list of required browser features:

* WebGL for graphics
	* Various extensions offer improvements
* WebWorkers for physics
* PointerLock for FPS controls (fallback available)
* `requestAnimationFrame` for best animation (fallbackl available)

This is based on several JS libraries, most prominently:

* Three.js - http://mrdoob.github.com/three.js/
	* Graphics engine
* Physijs - http://chandlerprall.github.com/Physijs/
	* Physics engine
* dat.GUI - http://code.google.com/p/dat-gui/
	* Settings GUI

Copyright
=========

Unless otherwise stated, code in `js/` is mine:

	Copyright (c) Tapio Vierros. All rights reserved.

Third-party code is in `libs/` and belongs to their respective owners.
Their licenses are mentioned in the files.

The licenses of models and textures in `assets/` can be
viewed from their respective `readme.txt` files.

