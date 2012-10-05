function Dungeon(scene, player) {
	var self = this;
	this.objects = [];
	var dummy_material = new THREE.MeshBasicMaterial({color: 0x000000});
	var debug_material = new THREE.MeshBasicMaterial({color: 0xff00ff});

	var WALL = "#";
	var OPEN = ".";

	this.generateMesh = function(level) {
		var block_materials = [
			cache.getMaterial(level.materials.wall), // right
			cache.getMaterial(level.materials.wall), // left
			dummy_material, // top
			dummy_material, // bottom
			cache.getMaterial(level.materials.wall), // back
			cache.getMaterial(level.materials.wall)  // front
		];
		var block_params = {};
		if (assets.materials[level.materials.wall] && assets.materials[level.materials.wall].roughness)
			block_params.roughness = assets.materials[level.materials.wall].roughness;

		// Level geometry
		var geometry = new THREE.Geometry(), mesh;
		var cell, px, nx, pz, nz, tess, cube;
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
					// If wall completely surrounded by walls, skip
					if (px + nx + pz + nz === 0) continue;
					tess = block_params.roughness ? 10 : 0;
					cube = new BlockGeometry(level.gridSize, level.roomHeight, level.gridSize,
						tess, tess, tess, block_materials,
						{ px: px, nx: nx, py: 0, ny: 0, pz: pz, nz: nz },
						level.gridSize/2, level.roomHeight/2, block_params.roughness);
					mesh = new THREE.Mesh(cube);
					mesh.position.x = (i + 0.5) * level.gridSize;
					mesh.position.y = 0.5 * level.roomHeight;
					mesh.position.z = (j + 0.5) * level.gridSize;
					THREE.GeometryUtils.merge(geometry, mesh);
					// Collision body
					// Bounding box needs tweaking if there is only one side in the block
					cube.computeBoundingBox();
					if (Math.abs(cube.boundingBox.max.x - cube.boundingBox.min.x) <= 0.5) {
						cube.boundingBox.min.x = -0.5 * level.gridSize;
						cube.boundingBox.max.x = 0.5 * level.gridSize;
					}
					if (Math.abs(cube.boundingBox.max.z - cube.boundingBox.min.z) <= 0.5) {
						cube.boundingBox.min.z = -0.5 * level.gridSize;
						cube.boundingBox.max.z = 0.5 * level.gridSize;
					}
					var wallbody = new Physijs.BoxMesh(cube, dummy_material, 0);
					wallbody.position.copy(mesh.position);
					wallbody.visible = false;
					scene.add(wallbody);
				} else {

				}
			}
		}

		// Ceiling, no collision needed
		var ceiling_plane = new THREE.Mesh(
			new PlaneGeometry(level.gridSize * level.width, level.gridSize * level.depth,
				1, 1, "ny", level.width, level.depth),
			cache.getMaterial(level.materials.ceiling)
		);
		ceiling_plane.position.set(level.gridSize * level.width * 0.5, level.roomHeight, level.gridSize * level.depth * 0.5);
		scene.add(ceiling_plane);

		// Floor with collision
		var floor_plane = new Physijs.PlaneMesh(
			new PlaneGeometry(level.gridSize * level.width, level.gridSize * level.depth,
				1, 1, "py", level.width, level.depth),
			Physijs.createMaterial(cache.getMaterial(level.materials.floor), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		floor_plane.position.set(level.gridSize * level.width * 0.5, 0.0, level.gridSize * level.depth * 0.5);
		floor_plane.receiveShadow = true;
		scene.add(floor_plane);

		// Level mesh
		geometry.computeTangents();
		mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
		mesh.receiveShadow = true;
		scene.add(mesh);
	};

	this.addLights = function(level) {
		// Ambient
		scene.add(new THREE.AmbientLight(0xaaaaaa));

		// Point lights
		for (var i = 0; i < level.lights.length; ++i) {
			// Actual light
			var light = new THREE.PointLight(0xffffaa, 1, 2 * level.gridSize);
			light.position.copy(level.lights[i].position);
			light.position.x *= level.gridSize;
			light.position.z *= level.gridSize;
			scene.add(light);
			lightManager.addLight(light);

			// Shadow casting light
			if (level.lights[i].target) {
				var light2 = new THREE.SpotLight(0xffffaa, light.intensity, light.distance);
				light2.position = light.position;
				light2.target.position.copy(level.lights[i].target);
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
			}

			// Flame
			if (CONFIG.particles)
				light.emitter = createSimpleFire(light.position);
		}

		// Player's torch
		player.light = new THREE.PointLight(0x88bbff, 1, level.gridSize * 3);
		scene.add(player.light);
		player.shadow = new THREE.SpotLight(player.light.color, player.light.intensity, player.light.distance);
		player.shadow.angle = Math.PI / 4;
		player.shadow.onlyShadow = true;
		player.shadow.castShadow = true;
		player.shadow.shadowCameraNear = 0.1 * UNIT;
		player.shadow.shadowCameraFar = 10 * UNIT;
		player.shadow.shadowCameraFov = 90;
		player.shadow.shadowBias = -0.0002;
		player.shadow.shadowDarkness = 0.3;
		player.shadow.shadowMapWidth = 1024;
		player.shadow.shadowMapHeight = 1024;
		player.shadow.shadowCameraVisible = false;
		scene.add(player.shadow);
	};

	this.addObjects = function(level) {
		function objectHandler(pos, def) {
			return function handleObject(geometry) {
				if (!def) def = {};
				var obj, mass = def.mass || 0;
				var scale = 1.0;
				if (def.randScale) {
					scale += randf(-def.randScale, def.randScale);
					mass *= scale;
				}
				for (var m = 0; m < geometry.materials.length; ++m)
					fixAnisotropy(geometry.materials[m]);
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
				pos.x *= level.gridSize;
				pos.z *= level.gridSize;
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
				scene.add(obj);
			};
		}

		for (var i = 0; i < level.objects.length; ++i) {
			var objname = level.objects[i].name;
			var obj = cache.loadModel("assets/models/" + objname + "/" + objname + ".js",
				objectHandler(new THREE.Vector3().copy(level.objects[i].position), assets.objects[objname]));
		}
	};

	if (queryParams.level) {
		if (queryParams.level == "rand") {
			var gen = new MapGen();
			this.level = gen.generate();
		} else if (queryParams.level.length > 24) {
			var json = window.atob(queryParams.level);
			this.level = JSON.parse(json);
		} else {
			// TODO: Load the level named in the parameter
		}
	} else this.level = testLevel;

	this.level.get = this.level.get || function(x, z) {
		if (x < 0 || x >= this.width) return WALL;
		else if (z < 0 || z >= this.depth) return WALL;
		return this.map[z * this.width + x];
	};

	this.level.set = this.level.set || function(x, z, obj) {
		if (x < 0 || x >= this.width) return;
		else if (z < 0 || z >= this.depth) return;
		this.map[z * this.width + x] = obj;
	};

	// TODO: Set player rotation
	player.geometry.computeBoundingBox();
	player.position.x = this.level.start[0] * this.level.gridSize;
	player.position.y = 0.5 * (player.geometry.boundingBox.max.y - player.geometry.boundingBox.min.y) + 0.001;
	player.position.z = this.level.start[1] * this.level.gridSize;

	this.generateMesh(this.level);
	this.addLights(this.level);
	this.addObjects(this.level);
}
