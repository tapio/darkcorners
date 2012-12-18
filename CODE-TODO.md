TODO & Roadmap
==============

Core engine
-----------

* Reduce global namespace pollution
	- Introduce "DC" container global for the engine classes
	- Create suitable containers for global variables in main.js
	- Mark all remaining globals to JSHint
* Weapons from assets.js
	- Type (projectile, melee)
	- Model
	- Ammo type
	- Sound (shoot, reload, empty)
	- Offset from player
* Background music support for level files
* Make the engine run Plasma Forks
	- Then sync code to PF so that only assets differ
* Texture sharing between models
	- Mention texture path in assets.js
	- Expand to model sharing
* Individual wall texture to a block
* Multi-floor level geometry
	- Level file format spec (probably array of arrays)
	- Editor support
	- There is some code in very old version
	- Stairs
* Object LOD?
	- Use simpler mesh for far away objects
	- Use simple materials for far away objects
* Level mesh LOD?
	- Divide to chunks for simplifying based on distance
* Better character dynamics (so that object mass matters)


Gameplay
--------

* Melee weapons
* Complex enemy AI
	- Patrolling
	- No "eyes in the back"
	- Attacking
* Campaign
* Picking up objects


Editor
------

* Move things
* Clickable thumbnails
* Nicer UI
