"use strict";
var pl, controls, scene, renderer, composer;
var renderTargetParametersRGBA, renderTargetParametersRGB;
var colorTarget, depthTarget, depthPassPlugin;
var lightManager, dungeon;
var clock = new THREE.Clock();
var cache = new Cache();
var passes = {};

function init() {
	scene = new Physijs.Scene();
	scene.setGravity(new THREE.Vector3(0, -10 * UNIT, 0));
	scene.fog = new THREE.FogExp2(0x000000, 0.05);
	scene.addEventListener('update', function() {
		if (CONFIG.showStats) physicsStats.update();
	});

	pl = new Physijs.CapsuleMesh(
		new THREE.CylinderGeometry(0.8 * UNIT, 0.8 * UNIT, 2 * UNIT),
		new THREE.MeshBasicMaterial({ color: 0xff00ff }),
		100
	);
	pl.visible = false;
	// Add pl later to the scene

	pl.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1 * UNIT, 30 * UNIT);

	controls = new Controls(pl.camera, { mouse: mouseHandler });
	controls.movementSpeed = 10 * UNIT;
	controls.lookSpeed = 0.5;
	controls.lookVertical = true;
	controls.constrainVerticalLook = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.2;

	renderer = new THREE.WebGLRenderer({
		clearColor: 0x000000,
		maxLights: CONFIG.maxLights + 2, // Player light is separate
		antialias: CONFIG.antialias,
		preserveDrawingBuffer: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = CONFIG.shadows;
	renderer.shadowMapSoft = CONFIG.softShadows;
	renderer.shadowMapDebug = false;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = CONFIG.physicalShading;
	renderer.autoClear = false;
	if (!CONFIG.anisotropy) CONFIG.anisotropy = renderer.getMaxAnisotropy();

	renderTargetParametersRGB  = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
	renderTargetParametersRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
	depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParametersRGBA);
	colorTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParametersRGB);

	// Postprocessing effects
	passes.scene = new THREE.RenderPass(scene, pl.camera);
	passes.ssao = new THREE.ShaderPass(THREE.ShaderExtras.ssao);
	passes.ssao.uniforms.tDepth.value = depthTarget;
	passes.ssao.uniforms.size.value.set(window.innerWidth, window.innerHeight);
	passes.ssao.uniforms.cameraNear.value = pl.camera.near;
	passes.ssao.uniforms.cameraFar.value = pl.camera.far;
	passes.ssao.uniforms.fogNear.value = scene.fog.near;
	passes.ssao.uniforms.fogFar.value = scene.fog.far;
	passes.ssao.uniforms.fogEnabled.value = 0;
	passes.ssao.uniforms.aoClamp.value = 0.4;
	passes.ssao.uniforms.onlyAO.value = 0;
	passes.fxaa = new THREE.ShaderPass(THREE.ShaderExtras.fxaa);
	passes.fxaa.uniforms.resolution.value.set(1/window.innerWidth, 1/window.innerHeight);
	passes.bloom = new THREE.BloomPass(0.5);
	passes.adjust = new THREE.ShaderPass(THREE.ShaderExtras.hueSaturation);
	passes.adjust.uniforms.saturation.value = 0.2;

	composer = new THREE.EffectComposer(renderer, colorTarget);
	//composer.addPass(passes.scene);
	composer.addPass(passes.ssao);
	composer.addPass(passes.fxaa);
	composer.addPass(passes.bloom);
	composer.addPass(passes.adjust);
	composer.passes[composer.passes.length - 1].renderToScreen = true;

	// Depth pass
	depthPassPlugin = new THREE.DepthPassPlugin();
	depthPassPlugin.renderTarget = depthTarget;
	renderer.addPrePlugin(depthPassPlugin);

	if (CONFIG.quarterMode) onWindowResize();

	resetLevel();
	updateConfig();
	dumpInfo();
	initUI();
}

function resetLevel(levelName) {
	// TODO: Reloadless reset?
	if (dungeon) {
		if (levelName) window.location.hash = "#level=" + levelName;
		window.location.reload(true);
	}
	lightManager = new LightManager({ maxLights: CONFIG.maxLights, maxShadows: CONFIG.maxShadows });
	dungeon = new Dungeon(scene, pl, levelName);
}

function mouseHandler(button) {
	var _vector = new THREE.Vector3(0, 0, 1);
	var projector = new THREE.Projector();
	projector.unprojectVector(_vector, pl.camera);
	var ray = new THREE.Ray(pl.camera.position, _vector.subSelf(pl.camera.position).normalize());
	var intersections = ray.intersectObjects(dungeon.objects);
	if (intersections.length > 0) {
		var target = intersections[0].object;
		if (target.position.distanceToSquared(pl.position) < 9)
			target.applyCentralImpulse(_vector.multiplyScalar(10000));
	}
}

function animate(dt) {
	if (!dungeon.loaded) return;
	function getAnim(time) { return Math.abs(time - (time|0) - 0.5) * 2.0; }
	function fract(num) { return num - (num|0); }
	var i, v = new THREE.Vector3();

	for (i = 0; i < dungeon.monsters.length; ++i) {
		var monster = dungeon.monsters[i];
		// Look at player
		v.copy(pl.position);
		v.subSelf(monster.position);
		v.y = 0;
		monster.mesh.lookAt(v.normalize());
		// Move?
		if (monster.position.distanceToSquared(pl.position) > 4) {
			monster.mesh.updateAnimation(1000 * dt);
			monster.setLinearVelocity(v.multiplyScalar(monster.speed * dt));
		} else {
			// Oh noes, death!
			controls.active = false;
			if (!$("#deathscreen").is(':visible'))
				$("#deathscreen").fadeIn(500);
			$("#instructions").hide();
			monster.setLinearVelocity(v.set(0,0,0));
		}
	}

	// Lights
	var timeNow = new Date().getTime();
	for (i = 0; i < lightManager.lights.length; ++i) {
		var light = lightManager.lights[i];
		var anim = timeNow / (1000.0 + i);
		light.intensity = 0.5 + 0.5 * getAnim(anim);
		if (light.visible && light.emitter)
			light.emitter.update(dt).render();
	}
	if (dungeon.exitParticles) dungeon.exitParticles.update(dt).render();

	// Player light
	pl.light.intensity = 0.5 + 0.5 * getAnim(timeNow / 1000.0);
	pl.light.position.set(pl.position.x, pl.position.y + 0.2, pl.position.z);
	pl.shadow.position.copy(pl.light.position);
	pl.shadow.target.position.copy(controls.target);

	// Player weapon
	if (pl.rhand) {
		pl.rhand.position.set(pl.position.x, pl.position.y, pl.position.z);
		pl.rhand.rotation.copy(pl.camera.rotation);
		pl.rhand.updateMatrix();
		pl.rhand.rotation.y += Math.PI/3;
		pl.rhand.rotation.z += Math.PI/2;
		pl.rhand.translateX(0.2*UNIT);
		pl.rhand.translateY(0.2*UNIT);
		pl.rhand.translateZ(-0.5*UNIT);
	}

	// Trigger?
	var trigger = dungeon.getTriggerAt(pl.position);
	if (trigger) {
		if (trigger.type == "message") displayMessage(trigger.message);
	}

	// Exit?
	if (dungeon.isAtExit(pl.position))
		resetLevel(dungeon.level.next);
}

$(document).ready(function() {
	var v0 = new THREE.Vector3();
	var v1 = new THREE.Vector3();

	function formatRenderInfo(info) {
		var report = [
			"Prog:", info.memory.programs,
			"Geom:", info.memory.geometries,
			"Tex:", info.memory.textures,
			"Calls:", info.render.calls,
			"Verts:", info.render.vertices,
			"Faces:", info.render.faces,
			"Pts:", info.render.points
		];
		return report.join(' ');
	}

	function render() {
		requestAnimationFrame(render);
		if (!dungeon.loaded) return;

		// Player movement, controls and physics
		var dt = clock.getDelta();
		// Take note of the position
		v0.set(pl.camera.position.x, 0, pl.camera.position.z);
		// Let controls update the position
		controls.update(dt);
		// Get the new position
		v1.set(pl.camera.position.x, 0, pl.camera.position.z);
		// Subtract them to get the velocity
		v1.subSelf(v0);
		// Convert the velocity unit to per second
		v1.divideScalar(dt * UNIT);
		// We only use the planar velocity, so we preserve the old y-velocity
		var vy = pl.getLinearVelocity().y;
		// Set the velocity, but disallow jumping/flying, i.e. upwards velocity
		pl.setLinearVelocity({ x: v1.x, y: vy < 0 ? vy : 0, z: v1.z });
		// Simulate physics
		scene.simulate();
		// Put the camera/controls back to the real, simulated position
		// FIXME: 0.5 below is magic number to rise camera
		controls.object.position.set(pl.position.x, pl.position.y + 0.5, pl.position.z);

		animate(dt);
		lightManager.update(pl);
		renderer.clear();
		if (CONFIG.postprocessing) {
			renderer.shadowMapEnabled = CONFIG.shadows;
			depthPassPlugin.enabled = true;
			renderer.render(scene, pl.camera, composer.renderTarget2, true);
			if (CONFIG.showStats) rendererInfo.innerHTML = formatRenderInfo(renderer.info);
			renderer.shadowMapEnabled = false;
			depthPassPlugin.enabled = false;
			composer.render(dt);
		} else {
			renderer.render(scene, pl.camera);
			if (CONFIG.showStats) rendererInfo.innerHTML = formatRenderInfo();
		}

		if (CONFIG.showStats) renderStats.update();
	}

	init();
	render();
	displayMessage("Welcome.");
});
