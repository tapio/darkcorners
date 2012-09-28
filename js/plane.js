/**
 * original author mrdoob / http://mrdoob.com/ (THREE.PlaneGeometry)
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

PlaneGeometry = function ( width, height, segmentsWidth, segmentsheight, dir ) {

	THREE.Geometry.call( this );

	var ix, iz,
	width_half = width / 2,
	height_half = height / 2,
	gridX = segmentsWidth || 1,
	gridZ = segmentsheight || 1,
	gridX1 = gridX + 1,
	gridZ1 = gridZ + 1,
	segment_width = width / gridX,
	segment_height = height / gridZ,
	normal = new THREE.Vector3(),
	xmul = new THREE.Vector3(),
	ymul = new THREE.Vector3();

	dir = dir || "pz";
	switch (dir) {
		case "nx": normal.x = -1; xmul.z = -1; ymul.y = 1; break;
		case "px": normal.x =  1; xmul.z = 1; ymul.y = -1; break;
		case "ny": normal.y = -1; xmul.x = -1; ymul.z = 1; break;
		case "py": normal.y =  1; xmul.x = -1; ymul.z = -1; break;
		case "nz": normal.z = -1; xmul.x = -1; ymul.y = 1; break;
		case "pz": normal.z =  1; xmul.x = 1; ymul.y = -1; break;
		default: console.error("Unknown plane direction " + dir);
	}

	for ( iz = 0; iz < gridZ1; iz ++ ) {

		for ( ix = 0; ix < gridX1; ix ++ ) {

			var x = ix * segment_width - width_half;
			var y = iz * segment_height - height_half;

			var vert = new THREE.Vector3( x * xmul.x, x * xmul.y, x * xmul.z );
			vert.set( vert.x + y * ymul.x, vert.y + y * ymul.y, vert.z + y * ymul.z );
			this.vertices.push( vert );

		}

	}

	for ( iz = 0; iz < gridZ; iz ++ ) {

		for ( ix = 0; ix < gridX; ix ++ ) {

			var a = ix + gridX1 * iz;
			var b = ix + gridX1 * ( iz + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
			var d = ( ix + 1 ) + gridX1 * iz;

			var face = new THREE.Face4( a, b, c, d );
			face.normal.copy( normal );
			face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );

			this.faces.push( face );
			// Texture coordinate repeating is currently hard-coded so that
			// 2 units = 1 texture coord
			this.faceVertexUvs[ 0 ].push([
				new THREE.UV( ix / gridX * width/2, (1 - iz / gridZ) * height/2 ),
				new THREE.UV( ix / gridX * width/2, (1 - (iz + 1) / gridZ) * height/2 ),
				new THREE.UV( (ix + 1) / gridX * width/2, (1 - (iz+ 1) / gridZ) * height/2 ),
				new THREE.UV( (ix + 1) / gridX * width/2, (1 - iz / gridZ) * height/2 )
			]);

		}

	}

	this.computeCentroids();

};

PlaneGeometry.prototype = Object.create( THREE.Geometry.prototype );
