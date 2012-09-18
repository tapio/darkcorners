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

init();
render();

function init() {

	container = document.getElementById('container');

	scene = new Physijs.Scene();
	scene.setGravity(new THREE.Vector3(0, -10 * UNIT, 0));
	//scene.fog = new THREE.FogExp2(0x000000, 0.0005);

	pl = new Physijs.SphereMesh(
		new THREE.SphereGeometry(1.5 * UNIT),
		new THREE.MeshBasicMaterial({ color: 0xff00ff }),
		100
	);
	pl.visible = false;
	// Add pl later to the scene

	pl.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.01 * UNIT, 100 * UNIT);

	controls = new Controls(pl.camera);
	controls.movementSpeed = 10 * UNIT;
	controls.lookSpeed = 0.5;
	controls.lookVertical = true;
	controls.constrainVerticalLook = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.2;

	renderer = new THREE.WebGLRenderer({
		clearColor: 0x000000,
		maxLights: CONFIG.maxLights + 1, // Player light is separate
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

	var scenePass = new THREE.RenderPass(scene, pl.camera);
	var bloomPass = new THREE.BloomPass(0.5);
	var adjustPass = new THREE.ShaderPass(THREE.ShaderExtras["hueSaturation"]);
	adjustPass.uniforms.saturation.value = 0.3;
	adjustPass.renderToScreen = true;
	composer = new THREE.EffectComposer(renderer);
	composer.addPass(scenePass);
	composer.addPass(bloomPass);
	composer.addPass(adjustPass);

	lightManager = new LightManager({ maxLights: CONFIG.maxLights, maxShadows: CONFIG.maxShadows });

	dungeon = new Dungeon(scene, pl, maps.test);
	pl.camera.position.set(pl.position.x, pl.position.y, pl.position.z);
	scene.add(pl);
	lightManager.update(pl);

	dumpInfo();

	container.innerHTML = "";
	container.appendChild(renderer.domElement);

	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top = '0px';
	container.appendChild(stats.domElement);

	container.requestPointerLock = container.requestPointerLock ||
			container.webkitRequestPointerLock ||
			container.mozRequestPointerLock;

	$(window).resize(onWindowResize);
	$(window).blur(pause);
	$(window).focus(resume);
	$("#lockmouse").click(container.requestPointerLock);
	document.addEventListener('pointerlockchange', onPointerLockChange, false);
	document.addEventListener('webkitpointerlockchange', onPointerLockChange, false);
	document.addEventListener('mozpointerlockchange', onPointerLockChange, false);

	// GUI controls
	var gui = new dat.GUI();
	gui.add(CONFIG, "postprocessing");
	gui.add(CONFIG, "maxShadows", 0, 6).step(1).onChange(updateConfig);
	gui.add(CONFIG, "maxLights", 0, 6).step(1).onChange(updateConfig);
	gui.add(controls, "mouseFallback");
	var guiRenderer = gui.addFolder("Renderer (reload required)");
	guiRenderer.add(CONFIG, "antialias");
	guiRenderer.add(CONFIG, "shadows");
	guiRenderer.add(CONFIG, "softShadows");
	guiRenderer.add(CONFIG, "physicalShading");
	guiRenderer.add(CONFIG, "anisotropy", 1, renderer.getMaxAnisotropy()).step(1);
	guiRenderer.add(window, "reload");
}

function onWindowResize() {
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

function animate() {
	function getAnim(time) { return Math.abs(time - (time|0) - 0.5) * 2.0; }
	function fract(num) { return num - (num|0); }

	var timeNow = new Date().getTime();
	for (var i = 0; i < lightManager.lights.length; ++i) {
		var anim = timeNow / (1000.0 + i);
		//lightManager.lights[i].intensity = 0.5 + 0.5 * getAnim(anim);
		lightManager.lights[i].position.y = 4 * UNIT + (getAnim(anim) - 0.5) * UNIT;
	}

	var jigglyAng = fract(timeNow / 1000.0) * 2 * Math.PI;
	var jigglyDist = Math.sin(getAnim(timeNow / 240.0)) * 0.15 * UNIT;
	var jigglydx = Math.cos(jigglyAng) * jigglyDist;
	var jigglydz = Math.sin(jigglyAng) * jigglyDist;
	pl.light.position.set(pl.position.x+jigglydx, pl.position.y + 0.2 * UNIT, pl.position.z+jigglydz);
	pl.light.target.position.copy(controls.target);
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
	controls.object.position.set(pl.position.x, pl.position.y, pl.position.z);

	animate();
	lightManager.update(pl);
	//renderer.clear();
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
