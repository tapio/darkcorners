"use strict";
/**
 * original author mrdoob / http://mrdoob.com/ (THREE.CubeGeometry)
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Cube.as
 */

DC.BlockGeometry = function(width, height, depth, segmentsWidth, segmentsHeight, segmentsDepth, individualMaterials, sides, uRepeat, vRepeat, randDisplace) {
	THREE.Geometry.call(this);

	var scope = this,
	width_half = width / 2,
	height_half = height / 2,
	depth_half = depth / 2;

	uRepeat = uRepeat || 1;
	vRepeat = vRepeat || 1;
	randDisplace = randDisplace || 0;

	var mpx, mpy, mpz, mnx, mny, mnz;

	if (individualMaterials) {
		mpx = 0; mnx = 1; mpy = 2; mny = 3; mpz = 4; mnz = 5;
	} else {
		mpx = mnx = mpy = mny = mpz = mnz = 0;
	}

	this.sides = { px: true, nx: true, py: true, ny: true, pz: true, nz: true };

	if (sides) {
		for (var s in sides) {
			if (this.sides[s] !== undefined) {
				this.sides[s] = sides[s];
			}
		}
	}

	function buildPlane(u, v, udir, vdir, width, height, depth, materialIndex, flipNormal) {
		var w, ix, iy,
		gridX = segmentsWidth || 1,
		gridY = segmentsHeight || 1,
		width_half = width / 2,
		height_half = height / 2,
		offset = scope.vertices.length;

		if ((u === 'x' && v === 'y') || (u === 'y' && v === 'x')) {
			w = 'z';
		} else if ((u === 'x' && v === 'z') || (u === 'z' && v === 'x')) {
			w = 'y';
			gridY = segmentsDepth || 1;
		} else if ((u === 'z' && v === 'y') || (u === 'y' && v === 'z')) {
			w = 'x';
			gridX = segmentsDepth || 1;
		}

		var gridX1 = gridX + 1,
		gridY1 = gridY + 1,
		segment_width = width / gridX,
		segment_height = height / gridY,
		normal = new THREE.Vector3();

		normal[w] = depth > 0 ? 1 : - 1;
		if (flipNormal) normal[w] *= -1;

		for (iy = 0; iy < gridY1; iy ++) {
			for (ix = 0; ix < gridX1; ix ++) {
				var vector = new THREE.Vector3();
				vector[u] = (ix * segment_width - width_half) * udir;
				vector[v] = (iy * segment_height - height_half) * vdir;
				vector[w] = depth;
				// Random displacement?
				if (randDisplace && ix > 0 && ix < gridX1 - 1)
					vector[w] += -randDisplace + Math.random() * randDisplace * 2;

				scope.vertices.push(vector);
			}
		}

		for (iy = 0; iy < gridY; iy++) {
			for (ix = 0; ix < gridX; ix++) {
				var a = ix + gridX1 * iy;
				var b = ix + gridX1 * (iy + 1);
				var c = (ix + 1) + gridX1 * (iy + 1);
				var d = (ix + 1) + gridX1 * iy;

				var uva = new THREE.Vector2(ix / gridX * uRepeat, (1 - iy / gridY) * vRepeat);
				var uvb = new THREE.Vector2(ix / gridX * uRepeat, (1 - (iy + 1) / gridY) * vRepeat);
				var uvc = new THREE.Vector2((ix + 1) / gridX * uRepeat, (1 - (iy + 1) / gridY) * vRepeat);
				var uvd = new THREE.Vector2((ix + 1) / gridX * uRepeat, (1 - iy / gridY) * vRepeat);

				var face = new THREE.Face3(a + offset, b + offset, d + offset);
				face.normal.copy(normal);
				face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
				face.materialIndex = materialIndex;

				scope.faces.push(face);
				scope.faceVertexUvs[0].push([ uva, uvb, uvd ]);

				face = new THREE.Face3(b + offset, c + offset, d + offset);
				face.normal.copy(normal);
				face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone());
				face.materialIndex = materialIndex;

				scope.faces.push(face);
				scope.faceVertexUvs[0].push([ uvb.clone(), uvc, uvd.clone() ]);
			}
		}
	}

	this.sides.px && buildPlane('z', 'y', - 1, - 1, depth, height, width_half, mpx); // px
	this.sides.nx && buildPlane('z', 'y',   1, - 1, depth, height, - width_half, mnx); // nx
	this.sides.py && buildPlane('x', 'z', - 1,   1, width, depth, height_half, mpy, true); // py
	this.sides.ny && buildPlane('x', 'z', - 1, - 1, width, depth, - height_half, mny, true); // ny
	this.sides.pz && buildPlane('x', 'y',   1, - 1, width, height, depth_half, mpz); // pz
	this.sides.nz && buildPlane('x', 'y', - 1, - 1, width, height, - depth_half, mnz); // nz

	this.computeCentroids();
	this.mergeVertices();
	if (randDisplace)
		this.computeVertexNormals();

	this.dynamic = false;
};

DC.BlockGeometry.prototype = Object.create(THREE.Geometry.prototype);
