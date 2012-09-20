
function Dungeon(scene, player, map) {
	var self = this;
	this.width = map.map[0].length;
	this.depth = map.map.length;
	this.mesh = undefined;
	this.monsters = [];
	this.objects = [];
	var dummy_material = new THREE.MeshBasicMaterial({color: 0x000000});

	map.gridSize *= UNIT;

	var materials = {};
	for (var tex in map.blocks) {
		if (!map.blocks.hasOwnProperty(tex)) continue;
		var floor_mat = map.blocks[tex].floor ? cache.getMaterial(map.blocks[tex].floor) : dummy_material;
		var wall_mat = map.blocks[tex].wall ? cache.getMaterial(map.blocks[tex].wall) : dummy_material;
		var ceiling_mat = map.blocks[tex].ceiling ? cache.getMaterial(map.blocks[tex].ceiling) : dummy_material;
		materials[tex] = [
			wall_mat, // right
			wall_mat, // left
			ceiling_mat, // top
			floor_mat, // bottom
			wall_mat, // back
			wall_mat  // front
		];
	}

	function getCell(x, z) {
		if (x < 0 || x >= map.map[0].length) return "#";
		else if (z < 0 || z >= map.map.length) return "#";
		return map.map[z][x];
	}

	function getObjectHandler(x, y, z, def) {
		return function(geom) {
			if (!def) def = {};
			var obj;
			if (def.collision) {
				var material = Physijs.createMaterial(
					geom.materials[0], 0.7, 0.2); // friction, restition
				if (def.collision == "plane")
					obj = new Physijs.PlaneMesh(geom, material, def.mass);
				else if (def.collision == "box")
					obj = new Physijs.BoxMesh(geom, material, def.mass);
				else if (def.collision == "sphere")
					obj = new Physijs.SphereMesh(geom, material, def.mass);
				else if (def.collision == "cylinder")
					obj = new Physijs.CylinderMesh(geom, material, def.mass);
				else if (def.collision == "cone")
					obj = new Physijs.ConeMesh(geom, material, def.mass);
				else if (def.collision == "convex")
					obj = new Physijs.ConvexMesh(geom, material, def.mass);
				else throw "Unsupported collision mesh type " + def.collision;
				self.objects.push(obj);
			} else {
				obj = new THREE.Mesh(geom, def.faceMaterial ? new THREE.MeshFaceMaterial() : geom.materials[0]);
			}
			// Auto-height
			if (y === null) {
				if (geom.boundingBox)
					y = 2 * (geom.boundingBox.max.y - geom.boundingBox.min.y) + 0.001;
				else if (geom.boundingSphere)
					y = geom.boundingSphere.radius + 0.001;
				else
					y = 0;
			}
			obj.position.set(x, y, z);
			if (!def.noShadows) {
				obj.castShadow = true;
				obj.receiveShadow = true;
			}
			scene.add(obj);
		};
	}

	var cell, cell2, px, nx, pz, nz, py;
	var ambientLight = new THREE.AmbientLight(0xaaaaaa);
	scene.add(ambientLight);

	player.light = new THREE.PointLight(0x88bbff, 1, map.gridSize * 2);
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

	// TODO: Set player rotation
	player.position.set(map.start[0] * map.gridSize, map.roomHeight, map.start[1] * map.gridSize);

	var geometry = new THREE.Geometry(), light, light2, light_body, obj;
	var sphere = new THREE.SphereGeometry(0.05 * UNIT, 16, 8);

	for (var z = 0; z < this.depth; z++) {
		for (var x = 0; x < this.width; x++) {
			px = nx = pz = nz = py = 0;
			cell = getCell(x, z);
			// TODO: Remove hard coded "#", determine wall from block definitions
			if (cell == "#") {
				cell2 = getCell(x + 1, z);
				px = cell2 != "#" ? 1 : 0;
				cell2 = getCell(x - 1, z);
				nx = cell2 != "#" ? 1 : 0;
				cell2 = getCell(x, z + 1);
				pz = cell2 != "#" ? 1 : 0;
				cell2 = getCell(x, z - 1);
				nz = cell2 != "#" ? 1 : 0;
			} else {
				py = 1;
			}
			var sides = { px: px, nx: nx, py: py, ny: true, pz: pz, nz: nz };
			var cube = cache.getGeometry(cell + "-" + JSON.stringify(sides), function() {
				return new BlockGeometry(map.gridSize, map.roomHeight, map.gridSize, 1, 1, 1,
					materials[cell], sides);
			});
			this.mesh = new THREE.Mesh(cube);
			this.mesh.position.x = x * map.gridSize;
			this.mesh.position.y = map.roomHeight;
			this.mesh.position.z = z * map.gridSize;
			THREE.GeometryUtils.merge(geometry, this.mesh);
			// Collision body for walls
			if (cell == "#") {
				var wallbody = new Physijs.BoxMesh(cube, dummy_material, 0);
				wallbody.position.copy(this.mesh.position);
				wallbody.visible = false;
				scene.add(wallbody);
			}
			// Light
			if (cell == "*") {
				// Actual light
				light = new THREE.PointLight(0xffffaa, 1, 2 * map.gridSize);
				light.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z);
				scene.add(light);
				lightManager.addLight(light);
				// Shadow casting light
				light2 = new THREE.SpotLight(0xffffaa, light.intensity, light.distance);
				light2.position = light.position; //set(light.position.x, light.position.y, light.position.z);
				light2.target.position.set(light2.position.x, light2.position.y - 1, light2.position.z);
				light2.angle = Math.PI / 2;
				light2.castShadow = true;
				light2.onlyShadow = true;
				light2.shadowCameraNear = 0.1 * UNIT;
				light2.shadowCameraFar = 10 * UNIT;
				light2.shadowCameraFov = 100;
				light2.shadowBias = -0.0002;
				light2.shadowDarkness = 0.3;
				light2.shadowMapWidth = 256;
				light2.shadowMapHeight = 256;
				//light2.shadowCameraVisible = true;
				scene.add(light2);
				lightManager.addShadow(light2);
				// Debug body
				if (DEBUG) {
					light_body = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffffaa }));
					light_body.position = light.position;
					scene.add(light_body);
				}
			// Objects
			} else if (map.objects[cell]) {
				obj = map.objects[cell];
				cache.loadModel("assets/models/" + obj.name + "/" + obj.name + ".js",
					getObjectHandler(x * map.gridSize, null, z * map.gridSize, obj));
			}
		}
	}
	geometry.computeTangents();
	this.mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
	this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;
	scene.add(this.mesh);

	// Physics plane
	var ground_material = Physijs.createMaterial(dummy_material,
		0.9, // high friction
		0.0 // low restitution
	);
	ground_material.visible = false;
	var ground_plane = new Physijs.BoxMesh(
		new THREE.CubeGeometry(map.gridSize * this.width, 1, map.gridSize * this.depth),
		ground_material,
		0 // mass
	);
	ground_plane.position = new THREE.Vector3(map.gridSize * this.width * 0.5, 1, map.gridSize * this.depth * 0.5);
	scene.add(ground_plane);

	// Weapon
	cache.loadModel("assets/models/knife/knife.js", function(geometry) {
		player.rhand = new THREE.Mesh(geometry, geometry.materials[0]);
		//player.rhand.castShadow = true;
		player.rhand.receiveShadow = true;
		scene.add(player.rhand);
	});

	// Items
	//cache.loadModel("assets/models/items/health.js",
	//	getObjectHandler(player.position.x, 2, player.position.z, { faceMaterial: true, noShadows: true }));
	//cache.loadModel("assets/models/items/mana.js",
	//	getObjectHandler(player.position.x + 1, 2, player.position.z, { faceMaterial: true, noShadows: true }));

	// Monster
	cache.loadModel("assets/models/shdw3/shdw3.js", function(geometry) {
		geometry.computeMorphNormals();
		var colorMap = geometry.morphColors[ 0 ];
		for (var i = 0; i < colorMap.colors.length; ++i) {
			geometry.faces[i].color = colorMap.colors[i];
		}

		var material = new THREE.MeshPhongMaterial({
			color: 0x222222, specular: 0xffffff, shininess: 10,
			morphTargets: true, morphNormals: true, vertexColors: THREE.FaceColors,
			shading: THREE.SmoothShading, perPixel: true
		});

		var monster = new Physijs.CylinderMesh(
			new THREE.CylinderGeometry(0.4 * UNIT, 0.4 * UNIT, 2 * UNIT),
			dummy_material, 100000
		);
		monster.visible = false;
		monster.position.set(player.position.x + 4, player.position.y - 0.8, player.position.z);
		self.monsters.push(monster);

		monster.mesh = new THREE.MorphAnimMesh(geometry, material);
		monster.mesh.speed = 0.4;
		monster.mesh.duration = 2000;
		monster.mesh.time = 600 * Math.random();
		monster.mesh.castShadow = true;
		monster.mesh.receiveShadow = true;
		monster.add(monster.mesh);
		scene.add(monster);
		monster.setAngularFactor({ x: 0, y: 0, z: 0 });
	});

}
