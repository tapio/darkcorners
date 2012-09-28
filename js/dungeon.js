function Dungeon(scene, player) {
	var self = this;
	this.monsters = [];
	var dummy_material = new THREE.MeshBasicMaterial({color: 0x000000});
	var debug_material = new THREE.MeshBasicMaterial({color: 0xff00ff});

	var gridSize = 2;
	var roomHeight = 3;

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
		level.width = width; level.depth = depth;

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
				level.set(i, j, OPEN);
			}
		}

		// Populate
		for (var o = 0; o < 10; ++o) {

		}

		// Place player
		// TODO: Set player rotation
		player.geometry.computeBoundingBox();
		player.position.x = width * 0.5 * gridSize;
		player.position.y = 0.5 * (player.geometry.boundingBox.max.y - player.geometry.boundingBox.min.y) + 0.001;
		player.position.z = depth * 0.5 * gridSize;

		console.log(level);

		return level;
	};

	this.generateMesh = function(level) {
		// Materials
		var floor_mat = randElem(level.env.floor);
		var ceiling_mat = randElem(level.env.ceiling);
		var wall_mat = randElem(level.env.wall);
		var wall_materials = [
			cache.getMaterial(wall_mat), // right
			cache.getMaterial(wall_mat), // left
			dummy_material, // top
			dummy_material, // bottom
			cache.getMaterial(wall_mat), // back
			cache.getMaterial(wall_mat)  // front
		];

		// Level geometry
		var geometry = new THREE.Geometry()
		for (var j = 0; j < level.depth; ++j) {
			for (var i = 0; i < level.width; ++i) {
				
			}
		}

		// Level borders
		// TODO: Create bounding walls as single quads and physics planes

		// Ceiling, no collision needed
		console.log(level.width, level.depth, gridSize);
		var ceiling_plane = new THREE.Mesh(
			new BlockGeometry(gridSize * level.width, 0.01, gridSize * level.depth,
				level.width, 1, level.depth, cache.getMaterial(ceiling_mat),
				{ px: 0, nx: 0, py: 1, ny: 0, pz: 0, nz: 0 }),
			new THREE.MeshFaceMaterial()
		);
		ceiling_plane.position.set(gridSize * level.width * 0.5, roomHeight + 0.005, gridSize * level.depth * 0.5);
		scene.add(ceiling_plane);

		// Floor with collision
		var floor_plane = new Physijs.BoxMesh(
			new BlockGeometry(gridSize * level.width, 1, gridSize * level.depth,
				level.width, 1, level.depth, cache.getMaterial(floor_mat),
				{ px: 0, nx: 0, py: 0, ny: 1, pz: 0, nz: 0 }),
			Physijs.createMaterial(new THREE.MeshFaceMaterial(), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		floor_plane.position.set(gridSize * level.width * 0.5, -0.5, gridSize * level.depth * 0.5);
		scene.add(floor_plane);

		// Level mesh
		geometry.computeTangents();
		var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
		mesh.castShadow = true;
		mesh.receiveShadow = true;
		scene.add(mesh);
	};

	this.generateLights = function() {
		// Ambient
		scene.add(new THREE.AmbientLight(0xaaaaaa));
		// Point lights
		// TODO

		// Player's torch
		player.light = new THREE.PointLight(0x88bbff, 1, gridSize * 2);
		scene.add(player.light);
		player.shadow = new THREE.SpotLight(player.light.color, player.light.intensity, player.light.distance);
		player.shadow.angle = Math.PI / 4;
		player.shadow.onlyShadow = true;
		player.shadow.castShadow = true;
		player.shadow.shadowCameraNear = 0.1 * UNIT;
		player.shadow.shadowCameraFar = 10 * UNIT;
		player.shadow.shadowCameraFov = 60;
		player.shadow.shadowBias = -0.0002;
		player.shadow.shadowDarkness = 0.3;
		player.shadow.shadowMapWidth = 1024;
		player.shadow.shadowMapHeight = 1024;
		player.shadow.shadowCameraVisible = false;
		scene.add(player.shadow);
	}


	this.generate();
	this.generateMesh(this.levels[0]);
	this.generateLights();
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
