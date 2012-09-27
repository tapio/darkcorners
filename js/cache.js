
function Cache() {
	this.models = {};
	this.geometries = {};
	this.materials = {};
	var self = this;
	var loader = new THREE.JSONLoader();

	this.loadModel = function(path, callback) {
		var m = this.models[path];
		if (!m) { // First time request for this model
			this.models[path] = [ callback ];
			loader.load(path, function(geometry) {
				var mm = self.models[path];
				for (var i = 0; i < mm.length; ++i)
					mm[i](geometry);
				self.models[path] = geometry;
			});
		} else if (m instanceof Array) { // Pending
			m.push(callback);
		} else // Already loaded
			callback(m);
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
