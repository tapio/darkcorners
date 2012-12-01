"use strict";
function LightManager(params) {
	params = params || {};
	this.maxLights = params.maxLights || 4;
	this.maxShadows = params.maxShadows || 2;
	this.lights = [];
	this.shadows = [];

	this.addLight = function(light) {
		this.lights.push(light);
	};

	this.addShadow = function(light) {
		this.shadows.push(light);
	};

	var v1 = new THREE.Vector2();
	var v2 = new THREE.Vector2();

	this.update = function(observer) {
		function angleDist(a, b) {
			v1.set(a.x - observer.position.x, a.z - observer.position.z).normalize();
			v2.set(b.x - observer.position.x, b.z - observer.position.z).normalize();
			return Math.acos(v1.dot(v2));
		}
		function distSq(a, b) {
			var dx = b.x - a.x, dz = b.z - a.z;
			return dx * dx + dz * dz;
		}
		function sortByDist(a, b) {
			return distSq(a.position, observer.position) - distSq(b.position, observer.position);
		}
		var i, used = 0;

		this.lights.sort(sortByDist);
		for (i = 0; i < this.lights.length; ++i) {
			if (used < this.maxLights && (
				angleDist(this.lights[i].position, controls.target) < Math.PI * 0.4 ||
				distSq(this.lights[i].position, observer.position) < 1.5 * this.lights[i].distance * this.lights[i].distance))
				{
					this.lights[i].visible = true;
					++used;
			} else this.lights[i].visible = false;
		}

		this.shadows.sort(sortByDist);
		for (i = 0; i < this.shadows.length; ++i) {
			if (i < this.maxShadows) this.shadows[i].castShadow = true;
			else this.shadows[i].castShadow = false;
		}

	};
}
