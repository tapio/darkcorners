
function loadTexture(path) {
	var image = new Image();
	image.onload = function() { texture.needsUpdate = true; };
	image.src = path;
	var texture = new THREE.Texture(
		image,
		new THREE.UVMapping(),
		THREE.RepeatWrapping,
		THREE.RepeatWrapping,
		THREE.LinearFilter,
		THREE.LinearMipMapLinearFilter
	);
	return texture;
}

function createMaterial(base_image) {
	var ambient = 0x333333, diffuse = 0xbbbbbb, specular = 0xffffff, shininess = 35, scale = 1.0;

	var shader = THREE.ShaderUtils.lib["normal"];
	var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	uniforms["tDiffuse"].texture = loadTexture(base_image + ".jpg");
	uniforms["tSpecular"].texture = loadTexture(base_image + "_specular.jpg");
	uniforms["tNormal"].texture = loadTexture(base_image + "_normalmap.jpg");
	//uniforms["uShininess"].value = shininess;
	uniforms["uNormalScale"].value = -1;

	//uniforms["tDisplacement"].texture = THREE.ImageUtils.loadTexture(base_image + "_height.jpg");
	//uniforms["uDisplacementBias"].value = - 0.428408 * scale;
	//uniforms["uDisplacementScale"].value = 2.436143 * scale;

	uniforms["enableAO"].value = false;
	uniforms["enableDiffuse"].value = true;
	uniforms["enableSpecular"].value = true;
	uniforms["enableReflection"].value = false;

	uniforms["uDiffuseColor"].value.setHex(diffuse);
	uniforms["uSpecularColor"].value.setHex(specular);
	uniforms["uAmbientColor"].value.setHex(ambient);

	//uniforms["wrapRGB"].value.set(0.575, 0.5, 0.5);

	return new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: uniforms,
		lights: true });
}
