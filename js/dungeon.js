function Dungeon(scene, floorplan) {
	this.width = floorplan[0].length;
	this.depth = floorplan.length;
	this.mesh;

	var floor_mat = createMaterial("../assets/textures/floor");
	var wall_mat = createMaterial("../assets/textures/wall");
	var materials = [
		wall_mat, // right
		wall_mat, // left
		floor_mat, // top
		floor_mat, // bottom
		wall_mat, // back
		wall_mat  // front
	];

	function getCell(x, z) {
		if (x < 0 || x >= floorplan[0].length) return "#";
		else if (z < 0 || z >= floorplan.length) return "#";
		return floorplan[z][x];
	}

	var cell, cell2, px, nx, pz, nz, cubes = [];
	for (var i = 0; i < 16; i++) {
		px = (i & 8) == 8;
		nx = (i & 4) == 4;
		pz = (i & 2) == 2;
		nz = (i & 1) == 1;
		cubes[i] = new THREE.CubeGeometry(100, 100, 100, 1, 1, 1, materials, { px: px, nx: nx, py: true, ny: false, pz: pz, nz: nz });
	}

	var geometry = new THREE.Geometry();

	for (var z = 0; z < this.depth; z++) {
		for (var x = 0; x < this.width; x++) {
			px = nx = pz = nz = 0;
			cell = getCell(x, z);
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
			this.mesh = new THREE.Mesh(cubes[ px * 8 + nx * 4 + pz * 2 + nz ]);
			this.mesh.position.x = x * 100 - this.width/2 * 100;
			this.mesh.position.y = cell == "#" ? 100 : 0;
			this.mesh.position.z = z * 100 - this.depth/2 * 100;
			THREE.GeometryUtils.merge(geometry, this.mesh);
		}
	}
	geometry.computeTangents();
	this.mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
	/*this.mesh.castShadow = true;
	this.mesh.receiveShadow = true;*/
	scene.add(this.mesh);

	var ambientLight = new THREE.AmbientLight(0xcccccc);
	scene.add(ambientLight);

	var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(1, 1, 0.5).normalize();
	scene.add(directionalLight);

}
