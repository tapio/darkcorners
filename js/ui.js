var container, renderStats, physicsStats;

function initUI() {
	container = document.getElementById('container');

	container.innerHTML = "";
	container.appendChild(renderer.domElement);

	renderStats = new Stats();
	renderStats.domElement.style.position = 'absolute';
	renderStats.domElement.style.bottom = '0px';
	container.appendChild(renderStats.domElement);

	physicsStats = new Stats();
	physicsStats.domElement.style.position = 'absolute';
	physicsStats.domElement.style.bottom = '0px';
	physicsStats.domElement.style.left = '85px';
	container.appendChild(physicsStats.domElement);

	container.requestPointerLock = container.requestPointerLock ||
			container.mozRequestPointerLock || container.webkitRequestPointerLock;

	container.requestFullscreen = container.requestFullscreen ||
		container.mozRequestFullscreen || container.mozRequestFullScreen || container.webkitRequestFullscreen;

	$(window).resize(onWindowResize);
	$(window).blur(pause);
	$(window).focus(resume);
	$("#instructions").click(function() {
		// Firefox doesn't support fullscreenless pointer lock, so resort to this hack
		if (/Firefox/i.test(navigator.userAgent)) {
			var onFullscreenChange = function(event) {
				if (document.fullscreenElement || document.mozFullscreenElement || document.mozFullScreenElement) {
					document.removeEventListener('fullscreenchange', onFullscreenChange);
					document.removeEventListener('mozfullscreenchange', onFullscreenChange);
					container.requestPointerLock();
				}
			};
			document.addEventListener('fullscreenchange', onFullscreenChange, false);
			document.addEventListener('mozfullscreenchange', onFullscreenChange, false);
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
	var gui = new dat.GUI();
	gui.add(controls, "mouseFallback");
	var guiRenderer = gui.addFolder("Renderer options (reload required)");
	guiRenderer.add(CONFIG, "antialias").onChange(updateConfig);
	guiRenderer.add(CONFIG, "physicalShading").onChange(updateConfig);
	guiRenderer.add(CONFIG, "normalMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "specularMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "particles").onChange(updateConfig);
	guiRenderer.add(window, "reload");
	var guiLighting = gui.addFolder("Light and shadow");
	guiLighting.add(CONFIG, "maxLights", 0, 6).step(1).onChange(updateConfig);
	guiLighting.add(CONFIG, "maxShadows", 0, 6).step(1).onChange(updateConfig);
	guiLighting.add(CONFIG, "shadows").onChange(updateMaterials);
	guiLighting.add(CONFIG, "softShadows").onChange(updateMaterials);
	var guiTextures = gui.addFolder("Texture options");
	guiTextures.add(CONFIG, "anisotropy", 1, renderer.getMaxAnisotropy()).step(1).onChange(updateTextures);
	guiTextures.add(CONFIG, "linearTextureFilter").onChange(updateTextures);
	var guiPostproc = gui.addFolder("Post-processing");
	guiPostproc.add(CONFIG, "postprocessing").onChange(updateConfig);
	guiPostproc.add(CONFIG, "SSAO").onChange(updateConfig);
	guiPostproc.add(CONFIG, "FXAA").onChange(updateConfig);
	guiPostproc.add(CONFIG, "bloom").onChange(updateConfig);
	gui.close();
}

function onWindowResize() {
	pl.camera.aspect = window.innerWidth / window.innerHeight;
	pl.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	colorTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParametersRGB);
	composer.reset(colorTarget);
	depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParametersRGBA);
	depthPassPlugin.renderTarget = depthTarget;
	passes.ssao.uniforms.tDepth.value = depthTarget;
	passes.ssao.uniforms.size.value.set(window.innerWidth, window.innerHeight);
	passes.fxaa.uniforms.resolution.value.set(1/window.innerWidth, 1/window.innerHeight);
	controls.handleResize();
}

function onPointerLockChange() {
	if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
		controls.pointerLockEnabled = true;
		$("#instructions").hide();
	} else {
		controls.pointerLockEnabled = false;
		$("#instructions").show();
	}
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
