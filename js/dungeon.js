function Dungeon(scene, player, map) {
	this.width = map.map[0].length;
	this.depth = map.map.length;
	this.mesh = undefined;
	this.lights = [];
	var asset_path = "../assets/textures/";

	var materials = {};
	for (var tex in map.blocks) {
		if (!map.blocks.hasOwnProperty(tex)) continue;
		var floor_mat = map.blocks[tex].floor ? createMaterial(asset_path + map.blocks[tex].floor) : new THREE.MeshBasicMaterial();
		var wall_mat = map.blocks[tex].wall ? createMaterial(asset_path + map.blocks[tex].wall) : new THREE.MeshBasicMaterial();
		materials[tex] = [
			wall_mat, // right
			wall_mat, // left
			floor_mat, // top
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

	var cell, cell2, px, nx, pz, nz, cubes = [];
	/*for (var i = 0; i < 16; i++) {
		px = (i & 8) == 8;
		nx = (i & 4) == 4;
		pz = (i & 2) == 2;
		nz = (i & 1) == 1;
		cubes[i] = new THREE.CubeGeometry(100, 100, 100, 1, 1, 1, materials, { px: px, nx: nx, py: true, ny: false, pz: pz, nz: nz });
	}*/

	var ambientLight = new THREE.AmbientLight(0xaaaaaa);
	scene.add(ambientLight);

	var playerLight = new THREE.PointLight(0xffffaa, 1, map.gridSize * 2);
	//playerLight.position = player.position;
	scene.add(playerLight);
	this.lights.push(playerLight);

	// TODO: Set player rotation
	player.position.set(map.start[0] * map.gridSize, map.gridSize, map.start[1] * map.gridSize);

	var geometry = new THREE.Geometry(), light, light_body;
	var sphere = new THREE.SphereGeometry(5, 16, 8);

	for (var z = 0; z < this.depth; z++) {
		for (var x = 0; x < this.width; x++) {
			px = nx = pz = nz = 0;
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
			}
			// TODO: Would be nice to create less CubeGeometry instances
			var cube = new THREE.CubeGeometry(map.gridSize, map.gridSize, map.gridSize, 1, 1, 1,
				materials[cell], { px: px, nx: nx, py: true, ny: false, pz: pz, nz: nz });
			this.mesh = new THREE.Mesh(cube);
			//this.mesh = new THREE.Mesh(cubes[ px * 8 + nx * 4 + pz * 2 + nz ]);
			this.mesh.position.x = x * map.gridSize;
			this.mesh.position.y = cell == "#" ? map.gridSize : 0;
			this.mesh.position.z = z * map.gridSize;
			THREE.GeometryUtils.merge(geometry, this.mesh);
			if (cell == "*") {
				light = new THREE.PointLight(0xffffaa, 1, 2 * map.gridSize);
				light.position.set(this.mesh.position.x, this.mesh.position.y + map.gridSize, this.mesh.position.z);
				scene.add(light);
				this.lights.push(light);
				// Debug body
				if (DEBUG) {
					light_body = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 0xffffaa }));
					light_body.position = light.position;
					scene.add(light_body);
				}
			}
		}
	}
	geometry.computeTangents();
	this.mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
	/*this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;*/
	scene.add(this.mesh);
}
