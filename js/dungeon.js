function Dungeon(scene, player) {
	var self = this;
	this.monsters = [];
	var dummy_material = new THREE.MeshBasicMaterial({color: 0x000000});

	this.levels = [];

	this.generate = function() {
		var nLevels = 1;
		for (var i = 0; i < nLevels; ++i) {
			this.levels.push(this.generateLevel(new THREE.Vector3()));
		}
	};

	this.generateLevel = function(pos) {
		var width = rand(10,15), depth = rand(10,15);
		var level = { map: new Array(width * depth) };

		level.get = function(x, z) {
			if (x < 0 || x >= width) return null;
			else if (z < 0 || z >= depth) return null;
			return level.map[z * width + x];
		};

		level.set = function(x, z, obj) {
			if (x < 0 || x >= width) return;
			else if (z < 0 || z >= depth) return;
			level.map[z * width + x] = obj;
		};

		// Materials
		level.env = randProp(assets.environments);

		var WALL = "#";
		var OPEN = ".";

		// Outline & rooms
		for (var j = 0; j < depth; ++j) {
			for (var i = 0; i < width; ++i) {
				if (i == 0 || j == 0 || i == width-1 || j == depth-1)
					level.set(i, j, WALL);
				else level.set(i, j, OPEN);
			}
		}

		// Populate
		for (var o = 0; o < 10; ++o) {

		}

		console.log(level);

		return level;
	};

	this.generateMesh = function(level) {
		//var floor = randElem(level.env.floor);
		//var ceiling = randElem(level.env.ceiling);
		//var wall = randElem(level.env.wall);
	};

	this.generate();
	this.generateMesh(this.levels[0]);

}

function randProp(obj) {
	var result, count = 0;
	for (var prop in obj)
		if (Math.random() < 1.0 / ++count) result = prop;
	return result;
}

function randElem(arr) {
	return arr[(Math.random() * arr.length) | 0];
}

function rand(lo, hi) {
	return lo + Math.floor(Math.random() * (hi - lo + 1));
}
