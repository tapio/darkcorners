function Dungeon(scene, player) {
	var self = this;
	this.loaded = false;
	this.objects = [];
	var dummy_material = new THREE.MeshBasicMaterial({color: 0x000000});
	var debug_material = new THREE.MeshBasicMaterial({color: 0xff00ff});

	function objectHandler(level, pos, def) {
		return function(geometry) {
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
			if (!pos.y && pos.y !== 0) {
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

	this.generateMesh = function(level) {
		var sqrt2 = Math.sqrt(2);
		var block_mat = cache.getMaterial(level.materials.wall);
		var block_params = {};
		if (assets.materials[level.materials.wall] && assets.materials[level.materials.wall].roughness)
			block_params.roughness = assets.materials[level.materials.wall].roughness;

		// Level geometry
		var geometry = new THREE.Geometry(), mesh;
		var cell, px, nx, pz, nz, tess, cube, hash, rot;
		for (var j = 0; j < level.depth; ++j) {
			for (var i = 0; i < level.width; ++i) {
				px = nx = pz = nz = py = ny = 0;
				cell = level.map.get(i, j, OPEN);
				if (cell === OPEN) continue;
				if (cell === WALL || cell === DIAG) {
					px = level.map.get(i + 1, j) != OPEN ? 0 : 1;
					nx = level.map.get(i - 1, j) != OPEN ? 0 : 2;
					pz = level.map.get(i, j + 1) != OPEN ? 0 : 4;
					nz = level.map.get(i, j - 1) != OPEN ? 0 : 8;
					// If wall completely surrounded by walls, skip
					hash = px + nx + pz + nz;
					if (hash === 0) continue;
					tess = block_params.roughness ? 10 : 0;
					rot = 0;
					if (cell === DIAG && (hash == 5 || hash == 6 || hash == 9 || hash == 10)) {
						cube = new PlaneGeometry(level.gridSize * sqrt2, level.roomHeight, tess, tess,
							"px", level.gridSize * sqrt2 / 2, level.roomHeight / 2, block_params.roughness);
						if (hash == 5) rot = -45 / 180 * Math.PI;
						else if (hash == 6) rot = -135 / 180 * Math.PI;
						else if (hash == 9) rot = 45 / 180 * Math.PI;
						else if (hash == 10) rot = 135 / 180 * Math.PI;
						cube.materials = [ block_mat ];
					} else {
						cube = new BlockGeometry(level.gridSize, level.roomHeight, level.gridSize,
							tess, tess, tess, block_mat,
							{ px: px, nx: nx, py: 0, ny: 0, pz: pz, nz: nz },
							level.gridSize/2, level.roomHeight/2, block_params.roughness);
					}
					mesh = new THREE.Mesh(cube);
					mesh.position.x = (i + 0.5) * level.gridSize;
					mesh.position.y = 0.5 * level.roomHeight;
					mesh.position.z = (j + 0.5) * level.gridSize;
					mesh.rotation.y = rot;
					THREE.GeometryUtils.merge(geometry, mesh);
					// Collision body
					if (cell === DIAG) {
						cube = new THREE.CubeGeometry(0.01, level.roomHeight, level.gridSize * sqrt2);
					} else {
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
					}
					var wallbody = new Physijs.BoxMesh(cube, dummy_material, 0);
					wallbody.position.copy(mesh.position);
					wallbody.visible = false;
					scene.add(wallbody);
					if (cell === DIAG) {
						wallbody.rotation.y = rot;
						wallbody.__dirtyRotation = true;
					}
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

		// Exit
		cache.loadModel("assets/models/teleporter/teleporter.js",
			objectHandler(level, new THREE.Vector3().set(level.exit[0], null, level.exit[1]), assets.objects.teleporter));
		if (CONFIG.particles)
			this.exitParticles = createTeleporterParticles(
				new THREE.Vector3(level.exit[0] * level.gridSize, 0.5, level.exit[1] * level.gridSize));
	};

	this.addLights = function(level) {
		// Torch model load callback
		function torchHandler(pos, rot) {
			return function(geometry) {
				for (var m = 0; m < geometry.materials.length; ++m)
					fixAnisotropy(geometry.materials[m]);
				var mat = geometry.materials.length > 1 ? new THREE.MeshFaceMaterial() : geometry.materials[0];
				var obj = new THREE.Mesh(geometry, mat);
				obj.position.copy(pos);
				obj.rotation.y = rot;
				obj.castShadow = true;
				obj.receiveShadow = true;
				scene.add(obj);
			};
		}

		// Ambient
		scene.add(new THREE.AmbientLight(0xaaaaaa));

		// Point lights
		var vec = new THREE.Vector2();
		for (var i = 0; i < level.lights.length; ++i) {
			if (level.lights[i].position.y === undefined)
				level.lights[i].position.y = 2;
			// Actual light
			var light = new THREE.PointLight(0xffffaa, 1, 2 * level.gridSize);
			light.position.copy(level.lights[i].position);
			var torch = "assets/models/torch/torch.js";

			// Snap to wall
			// Create wall candidates for checking which wall is closest to the light
			vec.set(level.lights[i].position.x|0, level.lights[i].position.z|0);
			var candidates = [
				{ x: vec.x + 0.5, y: vec.y, a: Math.PI },
				{ x: vec.x + 1.0, y: vec.y + 0.5, a: Math.PI/2 },
				{ x: vec.x + 0.5, y: vec.y + 1.0, a: 0 },
				{ x: vec.x, y: vec.y + 0.5, a: -Math.PI/2 }
			];
			vec.set(level.lights[i].position.x, level.lights[i].position.z);
			// Find the closest
			var snapped = { d: 1000 };
			for (var j = 0; j < candidates.length; ++j) {
				candidates[j].d = vec.distanceToSquared(candidates[j]);
				if (candidates[j].d < snapped.d) snapped = candidates[j];
			}
			// Position the light to the wall
			light.position.x = snapped.x;
			light.position.z = snapped.y;
			// Get wall normal vector
			vec.set((level.lights[i].position.x|0) + 0.5, (level.lights[i].position.z|0) + 0.5);
			vec.subSelf(snapped).multiplyScalar(2);
			// Check if there actually is a wall
			if (level.map.get((light.position.x - vec.x * 0.5)|0, (light.position.z - vec.y * 0.5)|0) == WALL) {
				// Move out of the wall
				light.position.x += vec.x * 0.08;
				light.position.z += vec.y * 0.08;
			} else {
				// Switch to ceiling hanging light
				torch = Math.random() < 0.5 ? "assets/models/torch-hanging-01/torch-hanging-01.js"
					: "assets/models/torch-hanging-02/torch-hanging-02.js";
				light.position.x = (level.lights[i].position.x|0) + 0.5;
				light.position.y = level.roomHeight - 0.9;
				light.position.z = (level.lights[i].position.z|0) + 0.5;
			}

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

			// Mesh
			cache.loadModel(torch, torchHandler(new THREE.Vector3().copy(light.position), snapped.a));

			// Flame
			if (CONFIG.particles)
				light.emitter = createTexturedFire(light);
		}

		// Player's torch
		player.light = new THREE.PointLight(0xccccaa, 1, level.gridSize * 3);
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
		for (var i = 0; i < level.objects.length; ++i) {
			var objname = level.objects[i].name;
			var obj = cache.loadModel("assets/models/" + objname + "/" + objname + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.objects[i].position), assets.objects[objname]));
		}
	};

	function processLevel(level) {
		if (typeof(level) == "string")
			level = JSON.parse(level);
		if (level.map instanceof Array)
			level.map = new Map(level.width, level.depth, level.map);

		player.geometry.computeBoundingBox();
		player.position.x = level.start[0] * level.gridSize;
		player.position.y = 0.5 * (player.geometry.boundingBox.max.y - player.geometry.boundingBox.min.y) + 0.001;
		player.position.z = level.start[1] * level.gridSize;
		if (level.startAngle)
			controls.setYAngle(level.startAngle);
		scene.add(pl);
		pl.setAngularFactor({ x: 0, y: 0, z: 0 });

		self.generateMesh(level);
		self.addLights(level);
		self.addObjects(level);
		self.level = level;
		self.loaded = true;
	}

	if (!hashParams.level)
		hashParams.level = "cave-test";
	if (hashParams.level == "rand") {
		var gen = new MapGen();
		processLevel(gen.generate());
	} else if (hashParams.level.length > 24) {
		var json = window.atob(hashParams.level);
		processLevel(JSON.parse(json));
	} else {
		$.get("assets/levels/" + hashParams.level + ".json", processLevel);
	}

	this.serialize = function() {
		return JSON.stringify(this.level);
	}

}
