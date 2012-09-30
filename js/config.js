var DEBUG = true;
var UNIT = 1;

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";
}

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = '../libs/ammo.js';

var CONFIG = {
	postprocessing: true,
	maxLights: 4,
	maxShadows: 2,
	antialias: true,
	anisotropy: 0, // 0 = auto
	shadows: true,
	softShadows: true,
	physicalShading: true,
	normalMapping: true,
	specularMapping: true,
	perPixelLighting: true,
	linearTextureFilter: true,
	bloom: true,
	SSAO: true
};

var updateConfig = function() {
	lightManager.maxLights = CONFIG.maxLights;
	lightManager.maxShadows = CONFIG.maxShadows;
	renderer.shadowMapEnabled = CONFIG.shadows;
	renderer.shadowMapSoft = CONFIG.softShadows;
	renderer.physicallyBasedShading = CONFIG.physicalShading;
	passes.bloom.enabled = CONFIG.bloom;
	passes.ssao.enabled = CONFIG.SSAO;
	localStorage.setItem("CONFIG", JSON.stringify(CONFIG));
};

(function() {
	var loadedConfig = localStorage.getItem("CONFIG");
	if (loadedConfig) {
		loadedConfig = JSON.parse(loadedConfig);
		for (var prop in loadedConfig) {
			if (loadedConfig.hasOwnProperty(prop) && typeof loadedConfig[prop] !== "function")
				CONFIG[prop] = loadedConfig[prop];
		}
	}
})();
