
function Cache() {
	this.models = {};
	this.geometries = {};
	this.materials = {};
	var self = this;
	var loader = new THREE.JSONLoader();

	this.loadModel = function(path, callback) {
		var m = this.models[path];
		if (m) callback(m);
		else loader.load(path, function(geometry) {
			self.models[path] = geometry;
			callback(geometry);
		});
	};

	this.getGeometry = function(name, generator) {
		var g = this.geometries[name];
		if (g) return g;
		this.geometries[name] = g = generator();
		return g;
	};

	this.getMaterial = function(name) {
		var t = this.materials[name];
		if (t) return t;
		this.materials[name] = t = createMaterial(name);
		return t;
	};
}
