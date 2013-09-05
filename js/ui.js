"use strict";

DC.initUI = function() {
	var container = document.getElementById('container');
	container.appendChild(renderer.domElement);

	DC.renderStats = new Stats();
	DC.renderStats.domElement.style.position = 'absolute';
	DC.renderStats.domElement.style.bottom = '0px';
	container.appendChild(DC.renderStats.domElement);

	DC.physicsStats = new Stats();
	DC.physicsStats.domElement.style.position = 'absolute';
	DC.physicsStats.domElement.style.bottom = '0px';
	DC.physicsStats.domElement.style.left = '85px';
	container.appendChild(DC.physicsStats.domElement);

	if (!CONFIG.showStats) {
		DC.renderStats.domElement.style.display = "none";
		DC.physicsStats.domElement.style.display = "none";
	}

	DC.rendererInfo = document.getElementById("renderer-info");

	container.requestPointerLock = container.requestPointerLock ||
		container.mozRequestPointerLock || container.webkitRequestPointerLock;

	container.requestFullscreen = container.requestFullscreen ||
		container.mozRequestFullscreen || container.mozRequestFullScreen || container.webkitRequestFullscreen;

	$(window).resize(DC.onWindowResize);
	$(window).blur(pause);
	$(window).focus(resume);
	$("#instructions").click(function() {
		if (CONFIG.fullscreen) {
			var onFullscreenChange = function(event) {
				if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.mozFullScreenElement) {
					document.removeEventListener('fullscreenchange', onFullscreenChange);
					document.removeEventListener('mozfullscreenchange', onFullscreenChange);
					document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
					container.requestPointerLock();
				}
			};
			document.addEventListener('fullscreenchange', onFullscreenChange, false);
			document.addEventListener('mozfullscreenchange', onFullscreenChange, false);
			document.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
			container.requestFullscreen();
		} else {
			container.requestPointerLock();
		}
	});

	document.addEventListener('pointerlockchange', onPointerLockChange, false);
	document.addEventListener('webkitpointerlockchange', onPointerLockChange, false);
	document.addEventListener('mozpointerlockchange', onPointerLockChange, false);
	$("#instructions").show();

	// GUI controls
	dat.GUI.TEXT_CLOSED = 'Close Options';
	dat.GUI.TEXT_OPEN = 'Options';
	var gui = new dat.GUI();
	gui.add(CONFIG, "fullscreen").onChange(DC.updateConfig);
	gui.add(CONFIG, "resolution", 0.1, 1.0).step(0.1).onChange(function() { DC.updateConfig(); DC.onWindowResize(); });
	gui.add(CONFIG, "physicsFPS", 30, 100).step(10).onChange(DC.updateConfig);
	gui.add(CONFIG, "showStats").onChange(DC.updateConfig);
	gui.add(controls, "mouseFallback");
	gui.add(window, "editLevel");
	var guiAudio = gui.addFolder("Audio");
	guiAudio.add(CONFIG, "sounds").onChange(DC.updateConfig);
	guiAudio.add(CONFIG, "music").onChange(function() {
		if (CONFIG.music) soundManager.playMusic();
		else soundManager.stopMusic();
		DC.updateConfig();
	});
	var guiRenderer = gui.addFolder("Renderer options (reload required)");
	guiRenderer.add(CONFIG, "antialias").onChange(DC.updateConfig);
	guiRenderer.add(CONFIG, "physicalShading").onChange(DC.updateConfig);
	guiRenderer.add(CONFIG, "specularMapping").onChange(DC.updateConfig);
	guiRenderer.add(CONFIG, "normalMapping").onChange(DC.updateConfig);
	guiRenderer.add(CONFIG, "normalScale", 1.0, 5.0).step(0.5).onChange(DC.updateConfig);
	guiRenderer.add(CONFIG, "particles").onChange(DC.updateConfig);
	guiRenderer.add(window, "reload");
	var guiLighting = gui.addFolder("Light and shadow");
	guiLighting.add(CONFIG, "maxLights", 0, 10).step(1).onChange(DC.updateConfig);
	guiLighting.add(CONFIG, "maxShadows", 0, 6).step(1).onChange(DC.updateConfig);
	guiLighting.add(CONFIG, "shadows").onChange(updateMaterials);
	guiLighting.add(CONFIG, "softShadows").onChange(updateMaterials);
	guiLighting.add(CONFIG, "shadowMapSize", 1, 5).step(1).onChange(DC.updateConfig);
	guiLighting.add(CONFIG, "debugLights").onChange(DC.updateConfig);
	var guiTextures = gui.addFolder("Texture options");
	//guiTextures.add(CONFIG, "textureQuality", 0, 2).step(1).onChange(DC.updateConfig);
	guiTextures.add(CONFIG, "anisotropy", 1, renderer.getMaxAnisotropy()).step(1).onChange(updateTextures);
	guiTextures.add(CONFIG, "linearTextureFilter").onChange(updateTextures);
	var guiPostproc = gui.addFolder("Post-processing");
	guiPostproc.add(CONFIG, "postprocessing").onChange(DC.updateConfig);
	guiPostproc.add(CONFIG, "SSAO").onChange(DC.updateConfig);
	guiPostproc.add(CONFIG, "FXAA").onChange(DC.updateConfig);
	guiPostproc.add(CONFIG, "bloom").onChange(DC.updateConfig);
	gui.close();
};

function updateHUD() {
	$("#health").html(pl.hp);
	$("#bullets").html(pl.bullets);
	$("#clips").html(pl.clips);
}

var messageTimer = null;
function displayMessage(msg) {
	var elem = $("#message");
	if (messageTimer)
		window.clearTimeout(messageTimer);
	if (elem.is(':visible')) elem.stop(true, true).hide();
	elem.html(msg).fadeIn(2000);
	messageTimer = window.setTimeout(function() {
		elem.fadeOut(5000);
		messageTimer = null;
	}, 3000);
}

function displayMinorMessage(msg) {
	var elem = $("#minor-messages");
	if (!elem.is(':visible')) elem.html("");
	elem.stop(true, true);
	elem.prepend(msg + "<br/>").show().fadeOut(5000);
}

function editLevel() {
	var url = "editor/index.html#level=" + window.btoa(dungeon.serialize());
	window.open(url, "_blank");
}

DC.onWindowResize = function() {
	var scale = CONFIG.resolution;
	pl.camera.aspect = window.innerWidth / window.innerHeight;
	pl.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth * scale, window.innerHeight * scale);
	colorTarget = new THREE.WebGLRenderTarget(window.innerWidth * scale, window.innerHeight * scale, renderTargetParametersRGB);
	composer.reset(colorTarget);
	depthTarget = new THREE.WebGLRenderTarget(window.innerWidth * scale, window.innerHeight * scale, renderTargetParametersRGBA);
	depthPassPlugin.renderTarget = depthTarget;
	passes.ssao.uniforms.tDepth.value = depthTarget;
	passes.ssao.uniforms.size.value.set(window.innerWidth * scale, window.innerHeight * scale);
	passes.fxaa.uniforms.resolution.value.set(scale/window.innerWidth, scale/window.innerHeight);
	controls.handleResize();
};

function onPointerLockChange() {
	if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
		controls.pointerLockEnabled = true;
		$("#instructions").hide();
	} else {
		controls.pointerLockEnabled = false;
		if (!pl.dead) $("#instructions").show();
	}
}

function pause() {
	controls.active = false;
}

function resume() {
	controls.active = true;
}

function reload() {
	DC.updateConfig();
	window.location.reload();
}
