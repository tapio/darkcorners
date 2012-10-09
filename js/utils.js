"use strict";
var _textures = [];

function loadTexture(path, opts) {
	opts = opts || {};
	var image = new Image();
	image.onload = function() { texture.needsUpdate = true; };
	image.src = path;
	var texture = new THREE.Texture(
		image,
		new THREE.UVMapping(),
		THREE.RepeatWrapping,
		THREE.RepeatWrapping,
		CONFIG.linearTextureFilter ? THREE.LinearFilter : THREE.NearestFilter,
		CONFIG.linearTextureFilter ? THREE.LinearMipMapLinearFilter : THREE.NearestFilter,
		opts.alpha ? THREE.RGBAFormat : THREE.RGBFormat,
		THREE.UnsignedByteType,
		CONFIG.anisotropy
	);
	_textures.push(texture);
	return texture;
}


function updateTextures() {
	for (var i = 0; i < _textures.length; ++i) {
		_textures[i].magFilter = CONFIG.linearTextureFilter ? THREE.LinearFilter : THREE.NearestFilter;
		_textures[i].minFilter = CONFIG.linearTextureFilter ? THREE.LinearMipMapLinearFilter : THREE.NearestFilter;
		_textures[i].anisotropy = CONFIG.anisotropy;
		_textures[i].needsUpdate = true;
	}
	updateConfig();
}


function fixAnisotropy(mat) {
	if (!mat) return;

	function fixAnisotropyTex(tex) {
		if (!tex) return;
		tex.anisotropy = CONFIG.anisotropy;
		tex.needsUpdate = true;
	}

	if (mat instanceof THREE.ShaderMaterial) {
		fixAnisotropyTex(mat.uniforms.tDiffuse.value);
		fixAnisotropyTex(mat.uniforms.tNormal.value);
		fixAnisotropyTex(mat.uniforms.tSpecular.value);
		fixAnisotropyTex(mat.uniforms.tAO.value);
		fixAnisotropyTex(mat.uniforms.tCube.value);
		fixAnisotropyTex(mat.uniforms.tDisplacement.value);
	} else {
		fixAnisotropyTex(mat.map);
		fixAnisotropyTex(mat.normalMap);
		fixAnisotropyTex(mat.specularMap);
		fixAnisotropyTex(mat.lightMap);
	}
}


function updateMaterials() {
	for (var i in cache.materials) {
		if (!cache.materials.hasOwnProperty(i)) continue;
		cache.materials[i].needsUpdate = true;
		// Also affected: shadows, soft shadows, physical shading
	}
	updateConfig();
}


function createMaterial(name) {
	var texture_path = "assets/textures/";
	var ambient = 0x333333, diffuse = 0xbbbbbb, specular = 0xffffff, shininess = 30, scale = 1.0;
	/*var shader = THREE.ShaderUtils.lib["normal"];
	var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	uniforms["tDiffuse"].value = loadTexture(texture_path + name + ".jpg");
	uniforms["tSpecular"].value = loadTexture(texture_path + "specular/" + name + ".jpg");
	uniforms["tNormal"].value = loadTexture(texture_path + "normal/"  + name + ".jpg");
	uniforms["uShininess"].value = shininess;
	//uniforms["uNormalScale"].value = new THREE.Vector2(1, 1);

	//uniforms["tDisplacement"].texture = loadTexture(texture_path + "height/"  + name + ".jpg");
	//uniforms["uDisplacementBias"].value = - 0.428408 * scale;
	//uniforms["uDisplacementScale"].value = 2.436143 * scale;

	uniforms["enableAO"].value = false;
	uniforms["enableDiffuse"].value = true;
	uniforms["enableSpecular"].value = true;
	uniforms["enableReflection"].value = false;
	uniforms["enableDisplacement"].value = false;

	uniforms["uDiffuseColor"].value.setHex(diffuse);
	uniforms["uSpecularColor"].value.setHex(specular);
	uniforms["uAmbientColor"].value.setHex(ambient);

	uniforms["uDiffuseColor"].value.convertGammaToLinear();
	uniforms["uSpecularColor"].value.convertGammaToLinear();
	uniforms["uAmbientColor"].value.convertGammaToLinear();

	//uniforms["wrapRGB"].value.set(0.575, 0.5, 0.5);
	return new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: uniforms,
		fog: true,
		lights: true
	});*/

	return new THREE.MeshPhongMaterial({
		ambient: ambient,
		diffuse: diffuse,
		specular: specular,
		shininess: shininess,
		perPixel: true,
		map: loadTexture(texture_path + name + ".jpg"),
		specularMap: CONFIG.specularMapping ? loadTexture(texture_path  + "specular/" + name + ".jpg") : undefined,
		normalMap: CONFIG.normalMapping ? loadTexture(texture_path + "normal/" + name + ".jpg") : undefined
	});

}


function dumpInfo() {
	var gl = renderer.context;
	var gl_info = {
		"Version": gl.getParameter(gl.VERSION),
		"Shading language": gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
		"Vendor": gl.getParameter(gl.VENDOR),
		"Renderer": gl.getParameter(gl.RENDERER),
		"Max varying vectors": gl.getParameter(gl.MAX_VARYING_VECTORS),
		"Max vertex attribs": gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
		"Max vertex uniform vectors": gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
		"Max fragment uniform vectors": gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
		"Max renderbuffer size": gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
		"Max texture size": gl.getParameter(gl.MAX_TEXTURE_SIZE),
		"Max cube map texture size": gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
		"Max texture image units": gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
		"Max vertex texture units": gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		"Max combined texture units": gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
		"Max viewport dims": gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0] + "x" + gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]
	};
	console.log("WebGL info: ", gl_info);
}

function screenshot() {
	var dataUrl	= renderer.domElement.toDataURL("image/png");
	window.open(dataUrl, "_blank");
}


window.performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return new Date().getTime(); };
})();

function Profiler(name) {
	name = name || "Profiling";
	name += ": ";
	this.start = function() {
		this.time = window.performance.now();
	};
	this.end = function() {
		var diff = window.performance.now() - this.time;
		console.log(name + diff + "ms");
	};
	this.start();
}
