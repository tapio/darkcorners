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
	linearTextureFilter: true
};

var updateConfig = function() {
	lightManager.maxLights = CONFIG.maxLights;
	lightManager.maxShadows = CONFIG.maxShadows;
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

var container, stats;
var pl, controls, scene, renderer, composer;
var lightManager, dungeon;
var clock = new THREE.Clock();
var cache = new Cache();

function init() {

	container = document.getElementById('container');

	scene = new Physijs.Scene();
	scene.setGravity(new THREE.Vector3(0, -10 * UNIT, 0));
	//scene.fog = new THREE.FogExp2(0x000000, 0.0005);

	pl = new Physijs.CylinderMesh(
		new THREE.CylinderGeometry(0.4 * UNIT, 0.4 * UNIT, 2 * UNIT),
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
	if (CONFIG.anisotropy == 0) CONFIG.anisotropy = renderer.getMaxAnisotropy();

	// Postprocessing effects
	var scenePass = new THREE.RenderPass(scene, pl.camera);
	var fxaaPass = new THREE.ShaderPass(THREE.ShaderExtras["fxaa"]);
	fxaaPass.uniforms.resolution.value.set(1/window.innerWidth, 1/window.innerHeight);
	var bloomPass = new THREE.BloomPass(0.5);
	var adjustPass = new THREE.ShaderPass(THREE.ShaderExtras["hueSaturation"]);
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
	pl.camera.position.set(pl.position.x, pl.position.y, pl.position.z);
	scene.add(pl);
	pl.setAngularFactor({ x: 0, y: 0, z: 0 });
	lightManager.update(pl);

	dumpInfo();

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
	guiRenderer.add(CONFIG, "anisotropy", 1, renderer.getMaxAnisotropy()).step(1).onChange(updateConfig);
	guiRenderer.add(CONFIG, "antialias").onChange(updateConfig);
	guiRenderer.add(CONFIG, "shadows").onChange(updateConfig);
	guiRenderer.add(CONFIG, "softShadows").onChange(updateConfig);
	guiRenderer.add(CONFIG, "physicalShading").onChange(updateConfig);
	guiRenderer.add(CONFIG, "normalMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "specularMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "perPixelLighting").onChange(updateConfig);
	guiRenderer.add(CONFIG, "linearTextureFilter").onChange(updateConfig);
	guiRenderer.add(window, "reload");

	var now = new Date().getTime();
	console.log("Initialization took " + (now - performance.timing.navigationStart) + "ms");
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
	var i;

	for (i = 0; i < dungeon.monsters.length; ++i) {
		var monster = dungeon.monsters[i];
		monster.updateAnimation(1000 * dt);
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
		pl.rhand.translateY(-0.2*UNIT);
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

function dumpInfo() {
	var gl = renderer.context;
	gl_info = {
		"Version": gl.getParameter(gl.VERSION),
		"Shading language": gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
		"Vendor": gl.getParameter(gl.VENDOR),
		"Renderer": gl.getParameter(gl.RENDERER),
		"Max varying vectors": gl.getParameter(gl.MAX_VARYING_VECTORS),
		"Max vertex attribs": gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
		"Max vertex uniform vectors": gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
		"Max fragment uniform vectors": gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
		"Max renderbuffer size": gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
		"Max texture size": gl.getParameter(gl.MAX_TEXTURE_SIZE),
		"Max cube map texture size": gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
		"Max texture image units": gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
		"Max vertex texture units": gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		"Max combined texture units": gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
		"Max viewport dims": gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0] + "x" + gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]
	};
	console.log("WebGL info: ", gl_info);
}

init();
render();
