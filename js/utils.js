
function loadTexture(path) {
	var image = new Image();
	image.onload = function() { texture.needsUpdate = true; };
	image.src = path;
	var texture  = new THREE.Texture(image, new THREE.UVMapping(), THREE.RepeatWrapping, THREE.RepeatWrapping, THREE.LinearFilter, THREE.LinearMipMapLinearFilter );
	return new THREE.MeshLambertMaterial({ map: texture, ambient: 0xbbbbbb });
}
