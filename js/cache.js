"use strict";
function Cache() {
	this.models = {};
	this.geometries = {};
	this.materials = {};
	var self = this;
	var loader = new THREE.JSONLoader(true);
	loader.statusDomElement.style.left = "0px";
	loader.statusDomElement.style.fontSize = "1.8em";
	loader.statusDomElement.style.width = "auto";
	loader.statusDomElement.style.color = "#c00";
	document.body.appendChild(loader.statusDomElement);
	var modelsPending = 0;

	this.loadModel = function(path, callback) {
		var m = this.models[path];
		if (!m) { // First time request for this model
			this.models[path] = [ callback ];
			loader.statusDomElement.style.display = "block";
			modelsPending++;
			loader.load(path, function(geometry) {
				var mm = self.models[path];
				for (var i = 0; i < mm.length; ++i)
					mm[i](geometry);
				self.models[path] = geometry;
				modelsPending--;
				if (modelsPending == 0)
					loader.statusDomElement.style.display = "none";
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
