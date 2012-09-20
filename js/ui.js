
function initUI() {
	container = document.getElementById('container');

	container.innerHTML = "";
	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.bottom = '0px';
	container.appendChild(stats.domElement);

	container.requestPointerLock = container.requestPointerLock ||
			container.webkitRequestPointerLock ||
			container.mozRequestPointerLock;

	$(window).resize(onWindowResize);
	$(window).blur(pause);
	$(window).focus(resume);
	$("#lockmouse").click(function() {
		if (!controls.pointerLockEnabled) container.requestPointerLock();
	});
	document.addEventListener('pointerlockchange', onPointerLockChange, false);
	document.addEventListener('webkitpointerlockchange', onPointerLockChange, false);
	document.addEventListener('mozpointerlockchange', onPointerLockChange, false);

	// GUI controls
	var gui = new dat.GUI();
	gui.add(CONFIG, "postprocessing").onChange(updateConfig);
	gui.add(CONFIG, "maxShadows", 0, 6).step(1).onChange(updateConfig);
	gui.add(CONFIG, "maxLights", 0, 6).step(1).onChange(updateConfig);
	gui.add(controls, "mouseFallback");
	var guiRenderer = gui.addFolder("Renderer options (reload required)");
	guiRenderer.add(CONFIG, "antialias").onChange(updateConfig);
	guiRenderer.add(CONFIG, "shadows").onChange(updateConfig);
	guiRenderer.add(CONFIG, "softShadows").onChange(updateConfig);
	guiRenderer.add(CONFIG, "physicalShading").onChange(updateConfig);
	guiRenderer.add(CONFIG, "normalMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "specularMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "perPixelLighting").onChange(updateConfig);
	guiRenderer.add(window, "reload");
	var guiTextures = gui.addFolder("Texture options");
	guiTextures.add(CONFIG, "anisotropy", 1, renderer.getMaxAnisotropy()).step(1).onChange(updateTextures);
	guiTextures.add(CONFIG, "linearTextureFilter").onChange(updateTextures);
}

function onWindowResize() {
	// FIXME: Should update fxaaPass (or reset composer)
	pl.camera.aspect = window.innerWidth / window.innerHeight;
	pl.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	composer.reset();
	controls.handleResize();
}

function onPointerLockChange() {
	controls.pointerLockEnabled = !controls.pointerLockEnabled;
	document.getElementById("info").className = controls.pointerLockEnabled ? "hidden" : "";
}

function pause() {
	controls.active = false;
}

function resume() {
	controls.active = true;
}

function reload() {
	updateConfig();
	window.location.reload();
}
