"use strict";

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";
}

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = '../libs/ammo.js';

DC.hashParams = (function() {
	var params = {}, param;
	var q = window.location.hash.replace('#', '').split('&');
	for (var i = 0; i < q.length; ++i) {
		param = q[i].split('=');
		params[param[0]] = param[1];
	}
	return params;
})();

var CONFIG = {
	fullscreen: false,
	showStats: false,
	resolution: 1.0,
	physicsFPS: 60,
	sounds: true,
	music: true,
	postprocessing: true,
	particles: true,
	maxLights: 4,
	maxShadows: 2,
	antialias: true,
	anisotropy: 0, // 0 = auto
	shadows: true,
	softShadows: true,
	shadowMapSize: 2,
	physicalShading: true,
	normalMapping: true,
	specularMapping: true,
	linearTextureFilter: true,
	bloom: true,
	SSAO: true,
	FXAA: false,
	textureQuality: 2,
	normalScale: 2,
	debugLights: false
};

DC.updateConfig = function() {
	lightManager.maxLights = CONFIG.maxLights;
	lightManager.maxShadows = CONFIG.maxShadows;
	renderer.shadowMapEnabled = CONFIG.shadows;
	renderer.shadowMapType = CONFIG.softShadows ? THREE.PCFShadowMap : THREE.BasicShadowMap;
	renderer.physicallyBasedShading = CONFIG.physicalShading;
	passes.bloom.enabled = CONFIG.bloom;
	passes.ssao.enabled = CONFIG.SSAO;
	passes.fxaa.enabled = CONFIG.FXAA;
	scene.setFixedTimeStep(1 / CONFIG.physicsFPS);
	var statDisplay = CONFIG.showStats ? "block" : "none";
	if (DC.renderStats) DC.renderStats.domElement.style.display = statDisplay;
	if (DC.physicsStats) DC.physicsStats.domElement.style.display = statDisplay;
	if (DC.rendererInfo) DC.rendererInfo.style.display = statDisplay;
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
