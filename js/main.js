
var container, stats;
var pl, controls, scene, renderer, composer;
var lightManager, dungeon;
var clock = new THREE.Clock();
var cache = new Cache();

function init() {
	scene = new Physijs.Scene();
	scene.setGravity(new THREE.Vector3(0, -10 * UNIT, 0));
	scene.fog = new THREE.FogExp2(0x000000, 0.05);

	pl = new Physijs.CylinderMesh(
		new THREE.CylinderGeometry(0.8 * UNIT, 0.8 * UNIT, 2 * UNIT),
		new THREE.MeshBasicMaterial({ color: 0xff00ff }),
		100
	);
	pl.visible = false;
	// Add pl later to the scene

	pl.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1 * UNIT, 100 * UNIT);

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
		antialias: CONFIG.antialias
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = CONFIG.shadows;
	renderer.shadowMapSoft = CONFIG.softShadows;
	//renderer.shadowMapDebug = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = CONFIG.physicalShading;
	renderer.autoClear = false;
	if (!CONFIG.anisotropy) CONFIG.anisotropy = renderer.getMaxAnisotropy();

	// Postprocessing effects
	var scenePass = new THREE.RenderPass(scene, pl.camera);
	var fxaaPass = new THREE.ShaderPass(THREE.ShaderExtras.fxaa);
	fxaaPass.uniforms.resolution.value.set(1/window.innerWidth, 1/window.innerHeight);
	var bloomPass = new THREE.BloomPass(0.5);
	var adjustPass = new THREE.ShaderPass(THREE.ShaderExtras.hueSaturation);
	adjustPass.uniforms.saturation.value = 0.2;
	composer = new THREE.EffectComposer(renderer);
	composer.addPass(scenePass);
	//if (CONFIG.antialias) composer.addPass(fxaaPass);
	composer.addPass(bloomPass);
	composer.addPass(adjustPass);
	composer.passes[composer.passes.length - 1].renderToScreen = true;

	lightManager = new LightManager({ maxLights: CONFIG.maxLights, maxShadows: CONFIG.maxShadows });

	// Create level and finalize player
	dungeon = new Dungeon(scene, pl, maps.test);
	scene.add(pl);
	pl.setAngularFactor({ x: 0, y: 0, z: 0 });
	lightManager.update(pl);

	dumpInfo();
	initUI();

	var now = new Date().getTime();
	console.log("Initialization took " + (now - performance.timing.navigationStart) + "ms");
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
			target.applyCentralImpulse(_vector.multiplyScalar(1000));
	}
}

function animate(dt) {
	function getAnim(time) { return Math.abs(time - (time|0) - 0.5) * 2.0; }
	function fract(num) { return num - (num|0); }
	var i, v = new THREE.Vector3();

	for (i = 0; i < dungeon.monsters.length; ++i) {
		var monster = dungeon.monsters[i];
		monster.mesh.updateAnimation(1000 * dt);
		// Look at player
		v.copy(pl.position);
		v.subSelf(monster.position);
		v.y = 0;
		monster.mesh.lookAt(v.normalize());
		monster.setLinearVelocity(v.multiplyScalar(50 * dt));
	}

	// Lights
	var timeNow = new Date().getTime();
	for (i = 0; i < lightManager.lights.length; ++i) {
		var anim = timeNow / (1000.0 + i);
		//lightManager.lights[i].intensity = 0.5 + 0.5 * getAnim(anim);
		lightManager.lights[i].position.y = 4 * UNIT + (getAnim(anim) - 0.5) * UNIT;
	}

	// Player light
	var jigglyAng = fract(timeNow / 1000.0) * 2 * Math.PI;
	var jigglyDist = Math.sin(getAnim(timeNow / 240.0)) * 0.15 * UNIT;
	var jigglydx = Math.cos(jigglyAng) * jigglyDist;
	var jigglydz = Math.sin(jigglyAng) * jigglyDist;
	pl.light.position.set(pl.position.x+jigglydx, pl.position.y + 0.2 * UNIT, pl.position.z+jigglydz);
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
}

function render() {
	requestAnimationFrame(render);

	// Player movement, controls and physics
	var dt = clock.getDelta();
	var v0 = new THREE.Vector3(pl.camera.position.x, 0, pl.camera.position.z);
	controls.update(dt);
	var v1 = new THREE.Vector3(pl.camera.position.x, 0, pl.camera.position.z);
	v1.subSelf(v0); // Becomes velocity
	v1.divideScalar(dt * UNIT);
	v0 = pl.getLinearVelocity();
	pl.setLinearVelocity({ x: v1.x, y: v0.y < 0 ? v0.y : 0, z: v1.z });
	scene.simulate(); // Simulate physics
	// FIXME: 0.5 below is magic number to rise camera
	controls.object.position.set(pl.position.x, pl.position.y + 0.5, pl.position.z);

	animate(dt);
	lightManager.update(pl);
	renderer.clear();
	if (CONFIG.postprocessing) composer.render(dt);
	else renderer.render(scene, pl.camera);
	stats.update();
}

init();
render();
