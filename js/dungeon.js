function Dungeon(scene, player) {
	var self = this;
	this.objects = [];
	var dummy_material = new THREE.MeshBasicMaterial({color: 0x000000});
	var debug_material = new THREE.MeshBasicMaterial({color: 0xff00ff});

	var gridSize = 2;
	var roomHeight = 3;
	var WALL = "#";
	var OPEN = ".";

	this.levels = [];

	this.generate = function() {
		var nLevels = 1;
		for (var i = 0; i < nLevels; ++i) {
			this.levels.push(this.generateLevel(new THREE.Vector3()));
		}
	};

	this.generateLevel = function(pos) {
		var width = rand(15,25), depth = rand(15,25);
		var level = { map: new Array(width * depth) };
		level.width = width; level.depth = depth;

		level.get = function(x, z) {
			if (x < 0 || x >= width) return WALL;
			else if (z < 0 || z >= depth) return WALL;
			return level.map[z * width + x];
		};

		level.set = function(x, z, obj) {
			if (x < 0 || x >= width) return;
			else if (z < 0 || z >= depth) return;
			level.map[z * width + x] = obj;
		};

		// Materials
		level.env = randProp(assets.environments);

		// Outline & rooms
		for (var j = 0; j < depth; ++j) {
			for (var i = 0; i < width; ++i) {
				level.set(i, j, Math.random() < 0.2 ? WALL : OPEN);
			}
		}

		// Place player
		// TODO: Set player rotation
		player.geometry.computeBoundingBox();
		player.position.x = width * 0.5 * gridSize;
		player.position.y = 0.5 * (player.geometry.boundingBox.max.y - player.geometry.boundingBox.min.y) + 0.001;
		player.position.z = depth * 0.5 * gridSize;

		return level;
	};

	this.generateMesh = function(level) {
		// Materials
		var floor_mat = randElem(level.env.floor);
		var ceiling_mat = randElem(level.env.ceiling);
		var wall_mat = randElem(level.env.wall);
		var block_materials = [
			cache.getMaterial(wall_mat), // right
			cache.getMaterial(wall_mat), // left
			dummy_material, // top
			dummy_material, // bottom
			cache.getMaterial(wall_mat), // back
			cache.getMaterial(wall_mat)  // front
		];
		var block_params = {};
		if (assets.materials[wall_mat] && assets.materials[wall_mat].roughness)
			block_params.roughness = assets.materials[wall_mat].roughness;

		// Level geometry
		function getBlockGenerator(sides) {
			return function() {
				var tess = block_params.roughness ? 10 : 0;
				return new BlockGeometry(
					gridSize, roomHeight, gridSize, tess, tess, tess,
					block_materials, sides, gridSize/2, roomHeight/2, block_params.roughness);
			};
		}
		var geometry = new THREE.Geometry(), mesh;
		var cell, px, nx, pz, nz, hash;
		for (var j = 0; j < level.depth; ++j) {
			for (var i = 0; i < level.width; ++i) {
				px = nx = pz = nz = py = ny = 0;
				cell = level.get(i, j);
				if (cell === OPEN) continue;
				if (cell === WALL) {
					px = level.get(i + 1, j) == WALL ? 0 : 1;
					nx = level.get(i - 1, j) == WALL ? 0 : 2;
					pz = level.get(i, j + 1) == WALL ? 0 : 4;
					nz = level.get(i, j - 1) == WALL ? 0 : 8;
					hash = px + nx + pz + nz;
					// If wall completely surrounded by walls, skip
					if (hash === 0) continue;
					var cube = cache.getGeometry(hash, getBlockGenerator({ px: px, nx: nx, py: 0, ny: 0, pz: pz, nz: nz }));
					mesh = new THREE.Mesh(cube);
					mesh.position.x = (i + 0.5) * gridSize;
					mesh.position.y = 0.5 * roomHeight;
					mesh.position.z = (j + 0.5) * gridSize;
					THREE.GeometryUtils.merge(geometry, mesh);
					// Collision body
					var wallbody = new Physijs.BoxMesh(cube, dummy_material, 0);
					wallbody.position.copy(mesh.position);
					wallbody.visible = false;
					scene.add(wallbody);
				} else {

				}
			}
		}

		// Level borders
		function makeBorder(w, dir, x, z) {
			var border = new Physijs.PlaneMesh(
				new PlaneGeometry(gridSize * w, roomHeight, 1, 1, dir, w, roomHeight / 2),
				cache.getMaterial(wall_mat), 0);
			border.position.set(x, roomHeight/2, z);
			scene.add(border);
		}
		makeBorder(level.depth, "px", 0, gridSize * level.depth / 2); // neg x
		makeBorder(level.depth, "nx", gridSize * level.width, gridSize * level.depth / 2); // pos x
		makeBorder(level.width, "pz", gridSize * level.width / 2, 0); // neg z
		makeBorder(level.width, "nz", gridSize * level.width / 2, gridSize * level.depth); // pos z

		// Ceiling, no collision needed
		var ceiling_plane = new THREE.Mesh(
			new PlaneGeometry(gridSize * level.width, gridSize * level.depth,
				1, 1, "ny", level.width, level.depth),
			cache.getMaterial(ceiling_mat)
		);
		ceiling_plane.position.set(gridSize * level.width * 0.5, roomHeight, gridSize * level.depth * 0.5);
		scene.add(ceiling_plane);

		// Floor with collision
		var floor_plane = new Physijs.PlaneMesh(
			new PlaneGeometry(gridSize * level.width, gridSize * level.depth,
				1, 1, "py", level.width, level.depth),
			Physijs.createMaterial(cache.getMaterial(floor_mat), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		floor_plane.position.set(gridSize * level.width * 0.5, 0.0, gridSize * level.depth * 0.5);
		floor_plane.receiveShadow = true;
		scene.add(floor_plane);

		// Level mesh
		geometry.computeTangents();
		mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
		mesh.receiveShadow = true;
		scene.add(mesh);
	};

	this.generateLights = function(level) {
		// Ambient
		scene.add(new THREE.AmbientLight(0xaaaaaa));

		// Particle system initializer for point lights
		function particleSystemCreator(emitter) {
			var i, geometry = new THREE.Geometry();
			// Init vertices
			for (i = 0; i < emitter.nParticles(); i++)
				geometry.vertices.push(new THREE.Vector3());
			// Init colors
			geometry.colors	= new Array(emitter.nParticles());
			for (i = 0; i < emitter.nParticles(); i++)
				geometry.colors[i] = new THREE.Color();
			// Init material
			var texture	= Fireworks.ProceduralTextures.buildTexture();
			var material = new THREE.ParticleBasicMaterial({
				color: new THREE.Color(0xee8800).getHex(),
				size: 0.3,
				sizeAttenuation: true,
				vertexColors: true,
				map: texture,
				blending: THREE.AdditiveBlending,
				depthWrite: false,
				transparent: true
			});
			// Init particle system
			var particleSystem = new THREE.ParticleSystem(geometry, material);
			particleSystem.dynamic = true;
			particleSystem.sortParticles = true;
			particleSystem.position = light.position;
			scene.add(particleSystem);
			return particleSystem;
		}

		// Point lights
		var nLights = Math.floor(level.width * level.depth / 50);
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
			// Back away to wall face and convert to real units
			pos.x = (pos.x - 0.6 * dx + 0.5) * gridSize;
			pos.z = (pos.z - 0.6 * dz + 0.5) * gridSize;
			pos.y = roomHeight * 0.7;
			if (testOverlap(pos, lightManager.lights, 2.1 * gridSize)) continue;
			++i;
			// Actual light
			var light = new THREE.PointLight(0xffffaa, 1, 2 * gridSize);
			light.position.copy(pos);
			scene.add(light);
			lightManager.addLight(light);
			// Shadow casting light
			var light2 = new THREE.SpotLight(0xffffaa, light.intensity, light.distance);
			light2.position = light.position;
			light2.target.position.copy(light2.position);
			light2.target.position.x -= dx * 1.1; // Move target a bit outwards from the wall
			light2.target.position.y -= 1; // Shadow camera looks down
			light2.target.position.z -= dz * 1.1; // Move target a bit outwards from the wall
			light2.angle = Math.PI / 2;
			light2.castShadow = true;
			light2.onlyShadow = true;
			light2.shadowCameraNear = 0.1 * UNIT;
			light2.shadowCameraFar = light.distance * 1.5 * UNIT;
			light2.shadowCameraFov = 100;
			light2.shadowBias = -0.0002;
			light2.shadowDarkness = 0.3;
			light2.shadowMapWidth = 256;
			light2.shadowMapHeight = 256;
			light2.shadowCameraVisible = false;
			scene.add(light2);
			lightManager.addShadow(light2);

			light.emitter = Fireworks.createEmitter({ nParticles : 30 })
				.effectsStackBuilder()
					.spawnerSteadyRate(20)
					.position(Fireworks.createShapeSphere(0, 0, 0, 0.1))
					.velocity(Fireworks.createShapePoint(0, 1, 0))
					.lifeTime(0.3, 0.6)
					.renderToThreejsParticleSystem({
						particleSystem: particleSystemCreator
					}).back()
				.start();
		}

		// Player's torch
		player.light = new THREE.PointLight(0x88bbff, 1, gridSize * 3);
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
	};

	this.generateObjects = function(level) {
		function objectHandler(pos, def) {
			function fixAnisotropy(tex) {
				if (!tex) return;
				tex.anisotropy = CONFIG.anisotropy;
				tex.needsUpdate = true;
			}
			return function handleObject(geometry) {
				if (!def) def = {};
				var obj, mass = def.mass || 0;
				var scale = 1.0;
				if (def.randScale) {
					scale += randf(-def.randScale, def.randScale);
					mass *= scale;
				}
				var mat = geometry.materials.length > 1 ? new THREE.MeshFaceMaterial() : geometry.materials[0];
				if (def.collision) {
					var material = Physijs.createMaterial(mat, 0.7, 0.2); // friction, restition
					if (def.collision == "plane")
						obj = new Physijs.PlaneMesh(geometry, material, mass);
					else if (def.collision == "box")
						obj = new Physijs.BoxMesh(geometry, material, mass);
					else if (def.collision == "sphere")
						obj = new Physijs.SphereMesh(geometry, material, mass);
					else if (def.collision == "cylinder")
						obj = new Physijs.CylinderMesh(geometry, material, mass);
					else if (def.collision == "cone")
						obj = new Physijs.ConeMesh(geometry, material, mass);
					else if (def.collision == "convex")
						obj = new Physijs.ConvexMesh(geometry, material, mass);
					else throw "Unsupported collision mesh type " + def.collision;
					self.objects.push(obj);
				} else {
					obj = new THREE.Mesh(geometry, mat);
				}
				// Auto-height
				if (pos.y === null) {
					if (!geometry.boundingBox) geometry.computeBoundingBox();
					pos.y = 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y) + 0.001;
				}
				obj.position.copy(pos);
				obj.scale.set(scale, scale, scale);
				if (!def.noShadows) {
					obj.castShadow = true;
					obj.receiveShadow = true;
				}
				fixAnisotropy(obj.material.map);
				fixAnisotropy(obj.material.normalMap);
				fixAnisotropy(obj.material.specularMap);
				scene.add(obj);
			};
		}

		var nObjects = Math.floor(level.width * level.depth / 10);
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
			if (testOverlap(pos, this.objects, 1.1 * gridSize)) continue;
			++i;

			pos.x = (pos.x + 0.5) * gridSize;
			pos.z = (pos.z + 0.5) * gridSize;
			pos.y = null; // Auto

			var objname = randElem(level.env.objects);
			var obj = cache.loadModel("assets/models/" + objname + "/" + objname + ".js",
				objectHandler(new THREE.Vector3().copy(pos), assets.objects[objname]));
		}
	};

	this.generate();
	this.generateMesh(this.levels[0]);
	this.generateLights(this.levels[0]);
	this.generateObjects(this.levels[0]);
}

function testOverlap(pos, objects, tolerance) {
	if (!objects.length) return false;
	tolerance = tolerance ? 0.000001 : (tolerance * tolerance); // Distance squared
	for (var i = 0; i < objects.length; ++i) {
		var dx = objects[i].x - pos.x, dz = objects[i].z - pos.z;
		if (dx * dx + dz * dz <= tolerance) return true;
	}
	return false;
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
