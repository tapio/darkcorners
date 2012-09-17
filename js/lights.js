
function LightManager(params) {
	params = params || {};
	this.maxLights = params.maxLights || 4;
	this.maxShadows = params.maxShadows || 2;
	this.maxLightDistMul = params.maxLightDistMul || 10;
	this.maxShadowDistMul = params.maxShadowDistMul || 3;
	this.lights = [];
	this.shadows = [];

	this.addLight = function(light) {
		this.lights.push(light);
	};

	this.addShadow = function(light) {
		this.shadows.push(light);
	};

	// TODO: 2D frustrum culling
	this.update = function(observer) {
		function distSq(a, b) {
			var dx = b.x - a.x, dz = b.z - a.z;
			return dx * dx + dz * dz;
		}
		function sortByDist(a, b) {
			return distSq(a.position, observer.position) - distSq(b.position, observer.position);
		}
		var i;

		this.lights.sort(sortByDist);
		for (i = 0; i < this.lights.length; ++i) {
			if (i < this.maxLights) this.lights[i].visible = true;
			else this.lights[i].visible = false;
		}

		this.shadows.sort(sortByDist);
		for (i = 0; i < this.shadows.length; ++i) {
			if (i < this.maxShadows) this.shadows[i].castShadow = true;
			else this.shadows[i].castShadow = false;
		}

	};
}
