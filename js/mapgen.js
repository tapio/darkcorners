function MapGen() {
	var self = this;
	var WALL = "#";
	var OPEN = ".";

	// Checks if the given position overlaps with the given array of objects
	function testOverlap(pos, objects, tolerance) {
		if (!objects.length) return false;
		tolerance = tolerance ? tolerance * tolerance : 0.000001; // Distance squared
		for (var i = 0; i < objects.length; ++i) {
			var dx = objects[i].position.x - pos.x, dz = objects[i].position.z - pos.z;
			if (dx * dx + dz * dz <= tolerance) return true;
		}
		return false;
	}

	// Checks if the given grid position is a corridor
	function testCorridor(pos, level) {
		var count = 0;
		count += level.get(pos.x-1, pos.z) == WALL ? 1 : 0;
		count += level.get(pos.x+1, pos.z) == WALL ? 1 : 0;
		count += level.get(pos.x, pos.z-1) == WALL ? 1 : 0;
		count += level.get(pos.x, pos.z+1) == WALL ? 1 : 0;
		return count == 2;
	}

	this.generateMap = function(level) {
		var width = level.width = rand(25,35);
		var depth = level.depth = rand(25,35);
		level.map = new Array(width * depth);
		var i, j;

		level.get = function(x, z) {
			if (x < 0 || x >= this.width) return WALL;
			else if (z < 0 || z >= this.depth) return WALL;
			return this.map[z * this.width + x];
		};

		level.set = function(x, z, obj) {
			if (x < 0 || x >= this.width) return;
			else if (z < 0 || z >= this.depth) return;
			this.map[z * this.width + x] = obj;
		};

		// Materials
		level.env = randProp(assets.environments);
		level.materials = {
			floor: randElem(level.env.floor),
			ceiling: randElem(level.env.ceiling),
			wall: randElem(level.env.wall)
		};

		// Outline
		for (j = 0; j < depth; ++j)
			for (i = 0; i < width; ++i)
				level.set(i, j, WALL);

		// Create rooms
		var roomsize = rand(3,4);
		var rooms = Math.floor(width * depth / (roomsize * roomsize * 4));
		var x = rand(roomsize+1, width-roomsize-1);
		var z = rand(roomsize+1, depth-roomsize-1);
		var ox, oz, swapx, swapz;

		for (var room = 0; room < rooms; ++room) {
			var rw = rand(2, roomsize);
			var rd = rand(2, roomsize);
			var xx = x - rand(0, rw-1);
			var zz = z - rand(0, rd-1);

			// Floor for the room
			for (j = zz; j < zz + rd; ++j)
				for (i = xx; i < xx + rw; ++i)
					level.set(i, j, OPEN);

			ox = x; oz = z;

			// Don't create a dead end corridor
			if (room == rooms-1) break;

			// Pick new room location
			do {
				x = rand(roomsize+1, width-roomsize-1);
				z = rand(roomsize+1, depth-roomsize-1);
			} while (level.get(x,z) == WALL && Math.abs(ox-x) + Math.abs(oz-z) >= 30);

			// Do corridors
			swapx = x < ox;
			for (i = swapx ? x : ox; i < (swapx ? ox : x); ++i)
				level.set(i, oz, OPEN);
			swapz = z < oz;
			for (j = swapz ? z : oz; j < (swapz ? oz : z); ++j)
				level.set(x, j, OPEN);
		}

		// Count open space
		level.floorCount = 0;
		for (z = 0; z < depth; ++z)
			for (x = 0; x < width; ++x)
				if (level.get(x,z) == OPEN) level.floorCount++;

		// Place player
		do {
			level.start[0] = rand(roomsize+1, width-roomsize-1);
			level.start[1] = rand(roomsize+1, depth-roomsize-1);
		} while (level.get(level.start[0], level.start[1]) == WALL);
	};

	this.generateLights = function(level) {
		// Point lights
		var nLights = Math.floor(level.floorCount / 20);
		var pos = new THREE.Vector3();
		var i = 0;
		while (i < nLights) {
			// Pick a random place
			pos.x = rand(0, level.width);
			pos.z = rand(0, level.depth);
			// Make sure we are not inside a wall
			if (level.get(pos.x, pos.z) === WALL) continue;
			// Pick a random cardinal direction
			var dir = rand(0,3) * Math.PI * 0.5;
			var dx = Math.round(Math.cos(dir));
			var dz = -Math.round(Math.sin(dir));
			// Travel until wall found
			while (level.get(pos.x, pos.z) !== WALL) {
				pos.x += dx;
				pos.z += dz;
			}
			// Back away to wall face
			pos.x = pos.x - 0.6 * dx + 0.5;
			pos.z = pos.z - 0.6 * dz + 0.5;
			pos.y = level.roomHeight * 0.7;
			if (testOverlap(pos, level.lights, 4.1)) continue;
			++i;
			// Actual light
			level.lights.push({
				position: { x: pos.x, y: pos.y, z: pos.z },
				target: { x: pos.x - dx * 1.1, y: pos.y - 1, z: pos.z - dz * 1.1 }
			});
		}
	};

	this.generateObjects = function(level) {
		// Placement
		var nObjects = Math.floor(level.floorCount / 8);
		var pos = new THREE.Vector3();
		var i = 0;
		while (i < nObjects) {
			// Pick a random place
			pos.x = rand(0, level.width);
			pos.z = rand(0, level.depth);
			// Make sure we are not inside a wall
			if (level.get(pos.x, pos.z) === WALL) continue;
			// TODO: Place most near walls
			// TODO: Groups, stacks, etc?

			if (testCorridor(pos, level)) continue;

			pos.x += 0.5;
			pos.z += 0.5;
			pos.y = null; // Auto

			if (testOverlap(pos, level.objects, 1.4)) continue;
			++i;

			var objname = randElem(level.env.objects);
			level.objects.push({
				name: objname,
				position: { x: pos.x, y: pos.y, z: pos.z }
			});
		}
	};

	this.generate = function() {
		var level = {
			map: [],
			objects: [],
			lights: [],
			gridSize: 2,
			roomHeight: 3,
			start: [ 0, 0 ]
		};
		this.generateMap(level);
		this.generateLights(level);
		this.generateObjects(level);
		return level;
	};
}




function randProp(obj) {
	var result, count = 0;
	for (var prop in obj)
		if (Math.random() < 1.0 / ++count) result = prop;
	return obj[result];
}

function randElem(arr) {
	return arr[(Math.random() * arr.length) | 0];
}

function rand(lo, hi) {
	return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function randf(lo, hi) {
	return lo + Math.random() * (hi - lo);
}
