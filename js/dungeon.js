"use strict";
DC.Dungeon = function(scene, player, levelName) {
	var self = this;
	this.onLoad = null;
	this.objects = [];
	this.monsters = [];
	this.grid = null;
	this.pathFinder = null;
	this.level = null;
	var dummy_material = new THREE.MeshBasicMaterial({ color: 0x000000 });
	var debug_material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
	var dead_material = new THREE.MeshLambertMaterial({ color: 0x222222, ambient: 0x222222 });
	var dummy_geometry = new THREE.Geometry();

	var modelTexturePath = "assets/models/";
	if (CONFIG.textureQuality === 0) modelTexturePath = "assets/models-256/";
	else if (CONFIG.textureQuality == 1) modelTexturePath = "assets/models-512/";

	function objectHandler(level, pos, ang, def) {
		return function(geometry, materials) {
			if (!def) def = {};
			var obj, mass = def.mass || 0;

			// Preprocessing
			if (def.character) mass = 100000;
			var scale = 1.0;
			if (def.randScale) {
				scale += randf(-def.randScale, def.randScale);
				mass *= scale;
			}
			if (!geometry.boundingBox) geometry.computeBoundingBox();
			geometry.dynamic = false;

			// Fix anisotropy and colors, set normalScale
			for (var m = 0; m < materials.length; ++m) {
				fixAnisotropy(materials[m]);
				if (materials[m].normalScale)
					materials[m].normalScale.set(CONFIG.normalScale, CONFIG.normalScale);
				// HACK: Should fix these in the JSON files
				materials[m].ambient.setRGB(0.5, 0.5, 0.5);
				materials[m].color.setRGB(0.6, 0.6, 0.6);
			}

			var mat = materials.length > 1 ? new THREE.MeshFaceMaterial(materials) : materials[0];

			// Mesh creation
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
				else if (def.collision == "capsule")
					obj = new Physijs.CapsuleMesh(geometry, material, mass);
				else if (def.collision == "convex")
					obj = new Physijs.ConvexMesh(geometry, material, mass);
				else if (def.collision == "concave")
					obj = new Physijs.ConcaveMesh(geometry, material, mass);
				else throw "Unsupported collision mesh type " + def.collision;
				self.objects.push(obj);
			} else {
				obj = new THREE.Mesh(geometry, mat);
			}

			// Positioning
			if (def.door) {
				// Fix door positions
				pos.x = Math.floor(pos.x) + 0.5;
				pos.z = Math.floor(pos.z) + 0.5;
			}
			pos.x *= level.gridSize;
			pos.z *= level.gridSize;
			if (!pos.y && pos.y !== 0) { // Auto-height
				pos.y = 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y) + 0.001;
			}
			obj.position.copy(pos);
			if (ang) obj.rotation.y = ang / 180 * Math.PI;

			// Other attributes
			obj.scale.set(scale, scale, scale);
			if (!def.noShadows && !def.animation) {
				obj.castShadow = true;
				obj.receiveShadow = true;
			}
			if (mass === 0 && !def.character) {
				obj.matrixAutoUpdate = false;
				obj.updateMatrix();
			}

			// Handle animated meshes
			if (def.animation) {
				obj.visible = false;
				// Switch the geometry to simple dummy one
				obj.geometry = dummy_geometry;
				// Create the animated mesh for displaying
				obj.mesh = animationManager.createAnimatedMesh(geometry, materials, def);
				if (!def.noShadows) {
					obj.mesh.castShadow = true;
					obj.mesh.receiveShadow = true;
				}
				obj.add(obj.mesh);
			}

			if (def.character) {
				if (def.character.hp) obj.hp = def.character.hp;
				obj.faction = def.character.faction || 1;
				self.monsters.push(obj);

				// Character collision callbacks
				obj.addEventListener('collision', function(other, vel, rot) {
					if (vel.lengthSq() < 1) return;
					if (other.damage && def.sound)
						soundManager.playSpatial(def.sound, other.position, 10);
					if (this.dead) return;
					if (this.hp && other.damage && other.position.y > 0.3 && this.faction != other.faction) {
						this.hp -= other.damage;
						other.damage = 0;
						// Check for death
						if (this.hp <= 0) {
							//soundManager.playSpatial("robot-death", 20);
							this.dead = true;
							if (this.mesh) this.mesh.animate = false;
							this.setAngularFactor({ x: 1, y: 1, z: 1 });
							this.setAngularVelocity({ x: 0, y: 0, z: 0 });
							this.setLinearVelocity({ x: 0, y: 0, z: 0 });
							this.mass = 2000;
							if (this.mesh) this.mesh.material = dead_material;
							else this.material = dead_material;
						} else {
							// Hit effect
							// TODO: Make this or similar work using the new non-shared materials
							//var mats = this.mesh.materials, m;
							//for (m = 0; m < mats.length; ++m) {
							//	mats[m].color.r += 0.05;
							//	mats[m].ambient.r += 0.05;
							//}
						}
					}
				});
			}

			if (def.item) {
				obj.items = {};
				obj.items[def.item.type] = def.item.value || 1;
				obj.itemName = def.name;
			}

			// Finalize
			scene.add(obj);
			if (def.character && def.collision) obj.setAngularFactor({ x: 0, y: 1, z: 0 });
			if (def.character) obj.speed = def.character.speed;
			if (def.door) {
				obj.setAngularFactor({ x: 0, y: 1, z: 0 });
				// Hinge
				var hingepos = obj.position.clone();
				var hingedist = 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x) - 0.1;
				hingepos.x -= Math.cos(obj.rotation.y) * hingedist;
				hingepos.z += Math.sin(obj.rotation.y) * hingedist;
				var constraint = new Physijs.HingeConstraint(
					obj,
					hingepos,
					new THREE.Vector3(0, 1, 0) // Hinge axisAxis along which the hinge lies - in this case it is the X axis
				);
				scene.addConstraint(constraint);
				constraint.setLimits(
					-Math.PI / 2 * 0.95 + obj.rotation.y, // minimum angle of motion, in radians
					Math.PI / 2 * 0.95 + obj.rotation.y, // maximum angle of motion, in radians
					0.3, // bias_factor, applied as a factor to constraint error
					0.01 // relaxation_factor, controls bounce at limit (0.0 == no bounce)
				);
			}
		};
	}

	this.generateMesh = function(level) {
		if (!level.map) return;
		var sqrt2 = Math.sqrt(2);
		var block_mat = cache.getMaterial(level.materials.wall);
		var block_params = assets.materials[level.materials.wall] || {};

		// Level geometry
		var geometry = new THREE.Geometry(), mesh = new THREE.Mesh();
		var cell, px, nx, pz, nz, py, ny, tess, cube, hash, rot, repeat;
		for (var j = 0; j < level.depth; ++j) {
			for (var i = 0; i < level.width; ++i) {
				px = nx = pz = nz = py = ny = 0;
				cell = level.map.get(i, j, OPEN);
				if (cell === OPEN) continue;
				if (cell === WALL || cell === DIAG) {
					px = level.map.get(i + 1, j) == OPEN ? 1 : 0;
					nx = level.map.get(i - 1, j) == OPEN ? 2 : 0;
					pz = level.map.get(i, j + 1) == OPEN ? 4 : 0;
					nz = level.map.get(i, j - 1) == OPEN ? 8 : 0;
					// If wall completely surrounded by walls, skip
					hash = px + nx + pz + nz;
					if (hash === 0) continue;
					tess = block_params.roughness ? 10 : 0;
					repeat = block_params.repeat || 1;
					rot = 0;
					if (cell === DIAG && (hash == 5 || hash == 6 || hash == 9 || hash == 10)) {
						cube = new DC.PlaneGeometry(level.gridSize * sqrt2, level.roomHeight, tess, tess,
							"px", level.gridSize * sqrt2 / 2 * repeat, level.roomHeight / 2 * repeat, block_params.roughness);
						if (hash == 5) rot = -45 / 180 * Math.PI;
						else if (hash == 6) rot = -135 / 180 * Math.PI;
						else if (hash == 9) rot = 45 / 180 * Math.PI;
						else if (hash == 10) rot = 135 / 180 * Math.PI;
					} else {
						cube = new DC.BlockGeometry(level.gridSize, level.roomHeight, level.gridSize,
							tess, tess, tess, false,
							{ px: px, nx: nx, py: 0, ny: 0, pz: pz, nz: nz },
							level.gridSize/2 * repeat, level.roomHeight/2 * repeat, block_params.roughness);
					}
					mesh.geometry = cube;
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
					wallbody.matrixAutoUpdate = false;
					scene.add(wallbody);
					if (cell === DIAG) {
						wallbody.rotation.y = rot;
						wallbody.__dirtyRotation = true;
					}
				}
			}
		}

		// Level mesh
		geometry.dynamic = false;
		//geometry.computeTangents();
		mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([ block_mat ]));
		mesh.receiveShadow = true;
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();
		scene.add(mesh);

		// Ceiling
		repeat = assets.materials[level.materials.ceiling] ? assets.materials[level.materials.ceiling].repeat || 1 : 1;
		var ceiling_plane = new Physijs.PlaneMesh(
			new DC.PlaneGeometry(level.gridSize * level.width, level.gridSize * level.depth,
				1, 1, "ny", level.width * repeat, level.depth * repeat),
			Physijs.createMaterial(cache.getMaterial(level.materials.ceiling), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		ceiling_plane.position.set(level.gridSize * level.width * 0.5, level.roomHeight, level.gridSize * level.depth * 0.5);
		ceiling_plane.matrixAutoUpdate = false;
		ceiling_plane.updateMatrix();
		ceiling_plane.geometry.dynamic = false;
		scene.add(ceiling_plane);

		// Floor
		repeat = assets.materials[level.materials.floor] ? assets.materials[level.materials.floor].repeat || 1 : 1;
		var floor_plane = new Physijs.PlaneMesh(
			new DC.PlaneGeometry(level.gridSize * level.width, level.gridSize * level.depth,
				1, 1, "py", level.width * repeat, level.depth * repeat),
			Physijs.createMaterial(cache.getMaterial(level.materials.floor), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		floor_plane.position.set(level.gridSize * level.width * 0.5, 0.0, level.gridSize * level.depth * 0.5);
		floor_plane.receiveShadow = true;
		floor_plane.matrixAutoUpdate = false;
		floor_plane.updateMatrix();
		floor_plane.geometry.dynamic = false;
		scene.add(floor_plane);
	};

	this.generateTerrain = function(level, heightData) {

	};

	this.addLights = function(level) {
		var shadowMapSizes = [ 64 /* Not used */, 128, 256, 512, 1024, 2048, 4096 /* Not used */ ];
		// Light model load callback
		function lightHandler(light, rot, offsetDir, def) {
			return function(geometry, materials) {
				for (var m = 0; m < materials.length; ++m)
					fixAnisotropy(materials[m]);
				if (!geometry.boundingBox) geometry.computeBoundingBox();
				geometry.dynamic = false;
				var mat = materials.length > 1 ? new THREE.MeshFaceMaterial(materials) : materials[0];
				var obj = new THREE.Mesh(geometry, mat, 0);
				obj.position.copy(light.position);
				// Offset position.xz only by boundingBox.z due to rotation
				// FIXME: Should properly translate in world space
				obj.position.x += offsetDir.x * (geometry.boundingBox.max.z - geometry.boundingBox.min.z) * 0.5;
				obj.position.y += offsetDir.y * (geometry.boundingBox.max.y - geometry.boundingBox.min.y) * 0.5;
				obj.position.z += offsetDir.z * (geometry.boundingBox.max.z - geometry.boundingBox.min.z) * 0.5;
				obj.rotation.y = rot;
				obj.castShadow = true;
				obj.receiveShadow = true;
				obj.matrixAutoUpdate = false;
				obj.updateMatrix();
				scene.add(obj);

				// Position actual light
				light.position.copy(obj.position);
				if (def.offset) {
					light.position.x += def.offset.x * Math.cos(rot) + def.offset.z * Math.sin(rot);
					light.position.y += def.offset.y;
					light.position.z += def.offset.x * Math.sin(rot) + def.offset.z * Math.cos(rot);
				}
				if (def.color) light.color.set(def.color);
				light.updateMatrix();
				lightManager.addLight(light);

				// Debug geometry
				if (CONFIG.debugLights) {
					var helper = new THREE.PointLightHelper(light, 0.05);
					scene.add(helper);
				}

				// Shadow casting light
				light.shadow.position.copy(light.position);
				light.shadow.position.y = level.roomHeight - 0.1;
				light.shadow.updateMatrix();
				lightManager.addShadow(light.shadow);

				// Flame
				if (CONFIG.particles && def.particles) {
					if (def.particles.type === "flame") {
						light.emitter = DC.createTexturedFire(light);
					} else if (def.particles.type === "magic") {
						light.emitter = DC.createTeleporterParticles(light.position);
					}
				}
			};
		}

		// Ambient
		scene.add(new THREE.AmbientLight(0x444444));

		// Point lights
		var vec = new THREE.Vector2();
		for (var i = 0; i < level.lights.length; ++i) {
			if (level.lights[i].position.y === undefined)
				level.lights[i].position.y = 2;
			var name = Math.random() < 0.5 ? "torch-hanging-01" : "torch-hanging-02";

			// Need to add lights before model handler so that object materials are compiled with enough lights
			var light = new THREE.PointLight(0xffff00, 1, level.gridSize * 2);
			light.matrixAutoUpdate = false;
			scene.add(light);

			// Shadow light (position set in model handler)
			light.shadow = new THREE.SpotLight(light.color.getHex(), light.intensity, light.distance);
			light.shadow.angle = Math.PI / 2;
			light.shadow.castShadow = true;
			light.shadow.onlyShadow = true;
			light.shadow.shadowCameraNear = 0.1;
			light.shadow.shadowCameraFar = light.distance * 1.5;
			light.shadow.shadowCameraFov = 100;
			light.shadow.shadowBias = -0.0002;
			light.shadow.shadowDarkness = 0.3;
			light.shadow.shadowMapWidth = shadowMapSizes[CONFIG.shadowMapSize];
			light.shadow.shadowMapHeight = shadowMapSizes[CONFIG.shadowMapSize];
			light.shadow.shadowCameraVisible = CONFIG.debugLights;
			light.shadow.matrixAutoUpdate = false;
			scene.add(light.shadow);

			// Snap to wall
			// Create wall candidates for checking which wall is closest to the light
			vec.set(level.lights[i].position.x|0, level.lights[i].position.z|0);
			var candidates = [
				{ x: vec.x + 0.5, y: vec.y, a: 0 },
				{ x: vec.x + 1.0, y: vec.y + 0.5, a: -Math.PI/2 },
				{ x: vec.x + 0.5, y: vec.y + 1.0, a: Math.PI },
				{ x: vec.x, y: vec.y + 0.5, a: Math.PI/2 }
			];
			vec.set(level.lights[i].position.x, level.lights[i].position.z);
			// Find the closest
			var snapped = { d: 1000 };
			for (var j = 0; j < candidates.length; ++j) {
				candidates[j].d = vec.distanceToSquared(candidates[j]);
				if (candidates[j].d < snapped.d) snapped = candidates[j];
			}
			// Position the light to the wall
			light.position.set(snapped.x, level.lights[i].position.y, snapped.y);
			var target = new THREE.Vector3();
			// Get wall normal vector
			vec.set((level.lights[i].position.x|0) + 0.5, (level.lights[i].position.z|0) + 0.5);
			vec.subSelf(snapped).multiplyScalar(2);
			var offsetDir = new THREE.Vector3();
			// Check if there actually is a wall
			if (level.map.get((light.position.x - vec.x * 0.5)|0, (light.position.z - vec.y * 0.5)|0) == WALL) {
				// Switch to wall light
				name = "torch";
				// Setup moving out of the wall
				offsetDir.set(vec.x, 0.0, vec.y);
				// Setup shadow target
				light.shadow.target.position.set(light.position.x + vec.x , light.position.y - 1, light.position.z + vec.y);
			} else {
				// Center the ceiling hanging light to grid cell
				light.position.x = (level.lights[i].position.x|0) + 0.5;
				light.position.y = level.roomHeight;
				light.position.z = (level.lights[i].position.z|0) + 0.5;
				// Setup moving out of the wall
				offsetDir.set(0.0, -1.0, 0.0);
				// Shadow target
				light.shadow.target.position.copy(light.position);
				light.shadow.target.position.y -= 1;
			}

			// Convert from grid units to real units
			light.position.x *= level.gridSize;
			light.position.z *= level.gridSize;
			light.shadow.target.position.x *= level.gridSize;
			light.shadow.target.position.z *= level.gridSize;

			// Mesh and final light positioning
			cache.loadModel("assets/models/" + name + "/" + name + ".js",
				lightHandler(light, snapped.a, offsetDir, assets.lights[name]),
				modelTexturePath + name);
		}

		// Player's torch
		player.light = new THREE.PointLight(0xccccaa, 1, level.gridSize * 3);
		scene.add(player.light);
		player.shadow = new THREE.SpotLight(player.light.color.getHex(), player.light.intensity, player.light.distance);
		player.shadow.angle = Math.PI / 4;
		player.shadow.onlyShadow = true;
		player.shadow.castShadow = true;
		player.shadow.shadowCameraNear = 0.1;
		player.shadow.shadowCameraFar = 10;
		player.shadow.shadowCameraFov = 90;
		player.shadow.shadowBias = -0.0002;
		player.shadow.shadowDarkness = 0.3;
		player.shadow.shadowMapWidth = shadowMapSizes[CONFIG.shadowMapSize];
		player.shadow.shadowMapHeight = shadowMapSizes[CONFIG.shadowMapSize];
		player.shadow.shadowCameraVisible = false;
		scene.add(player.shadow);
	};

	this.addObjects = function(level) {
		if (!level.objects) return;
		for (var i = 0; i < level.objects.length; ++i) {
			var name = level.objects[i].name;
			cache.loadModel("assets/models/" + name + "/" + name + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.objects[i].position),
					level.objects[i].angle, assets.objects[name]),
				modelTexturePath + name);
		}
	};

	this.addItems = function(level) {
		if (!level.items) return;
		for (var i = 0; i < level.items.length; ++i) {
			var name = level.items[i].name;
			cache.loadModel("assets/models/" + name + "/" + name + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.items[i].position),
					level.items[i].angle, assets.items[name]),
				modelTexturePath + name);
		}
	};

	this.addMonsters = function(level) {
		if (!level.monsters) return;
		for (var i = 0; i < level.monsters.length; ++i) {
			var name = level.monsters[i].name;
			cache.loadModel("assets/models/" + name + "/" + name + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.monsters[i].position),
					level.monsters[i].angle, assets.monsters[name]),
				modelTexturePath + name);
		}
	};

	this.getTriggerAt = function(pos) {
		if (!this.level || !this.level.triggers) return false;
		var triggers = this.level.triggers;
		for (var i = 0; i < triggers.length; ++i) {
			if (Math.abs(pos.x - triggers[i].position.x * this.level.gridSize) <= 1 &&
				Math.abs(pos.z - triggers[i].position.z * this.level.gridSize) <= 1)
					return triggers[i];
		}
	};

	this.isAtExit = function(pos) {
		return this.level &&
			Math.abs(pos.x - this.level.exit[0] * this.level.gridSize) < 0.5 * this.level.gridSize &&
			Math.abs(pos.z - this.level.exit[1] * this.level.gridSize) < 0.5 * this.level.gridSize;
	};

	function processLevel(level) {
		if (typeof(level) == "string")
			level = JSON.parse(level);

		// Floorplan
		if (level.map instanceof Array)
			level.map = new Map(level.width, level.depth, level.map);

		// Terrain heightmap
		if (level.terrain && level.terrain.heightmap) {
			loadHeightMap("assets/levels/" + level.terrain.heightmap, function(data) {
				self.generateTerrain(level, data);
			});
		}

		// Player
		player.geometry.computeBoundingBox();
		player.position.x = level.start[0] * level.gridSize;
		player.position.y = 0.5 * (player.geometry.boundingBox.max.y - player.geometry.boundingBox.min.y) + 0.001;
		player.position.z = level.start[1] * level.gridSize;
		if (level.startAngle)
			controls.setYAngle(level.startAngle);
		scene.add(player); // Here player is added to the scene
		player.setAngularFactor({ x: 0, y: 0, z: 0 });

		if (level.map)
			self.generateMesh(level);
		else level.map = new Map(level.width, level.depth, VOID);
		self.addLights(level);
		self.addObjects(level);
		self.addItems(level);
		self.addMonsters(level);

		// Exit
		cache.loadModel("assets/models/teleporter/teleporter.js",
			objectHandler(level, new THREE.Vector3().set(level.exit[0], null, level.exit[1]), 0, assets.objects.teleporter));
		if (CONFIG.particles)
			self.exitParticles = DC.createTeleporterParticles(
				new THREE.Vector3(level.exit[0] * level.gridSize, 0.5, level.exit[1] * level.gridSize));

		lightManager.update(pl);
		self.level = level;
		// Path finding stuff
		self.grid = new PF.Grid(level.width, level.depth, level.map.getWalkableMatrix());
		self.pathFinder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
			heurestic: PF.Heuristic.euclidean
		});
		// Callback
		if (self.onLoad) self.onLoad();
		else self.onLoad = true;

		if (level.title) displayMessage(level.title);
	}

	levelName = levelName || DC.hashParams.level || "cave-test";
	if (levelName == "rand") {
		var gen = new MapGen();
		processLevel(gen.generate());
	} else if (levelName.length > 24) {
		var json = window.atob(levelName);
		processLevel(JSON.parse(json));
	} else {
		$.get("assets/levels/" + levelName + ".json", processLevel);
	}

	this.serialize = function() {
		return JSON.stringify(this.level);
	};

	this.ready = function(callback) {
		if (this.onLoad === true) callback();
		else this.onLoad = callback;
	};
};
