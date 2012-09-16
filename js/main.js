var DEBUG = true;
var maxAnisotropy = 1;
var UNIT = 1;

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";
}

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = '../libs/ammo.js';


var container, stats;
var pl, controls, scene, renderer;
var dungeon;
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

	renderer = new THREE.WebGLRenderer({ clearColor: 0x000000, maxLights: 6, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = true;
	maxAnisotropy = renderer.getMaxAnisotropy();

	dungeon = new Dungeon(scene, pl, maps.test);
	pl.camera.position.set(pl.position.x, pl.position.y, pl.position.z);
	scene.add(pl);

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
}

function onWindowResize() {
	pl.camera.aspect = window.innerWidth / window.innerHeight;
	pl.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
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

function animate() {
	function getAnim(time) { return Math.abs(time - (time|0) - 0.5) * 2.0; }
	function fract(num) { return num - (num|0); }

	var timeNow = new Date().getTime();
	for (var i = 1; i < dungeon.lights.length; ++i) {
		var anim = timeNow / (1000.0 + i);
		//dungeon.lights[i].intensity = 0.5 + 0.5 * getAnim(anim);
		dungeon.lights[i].position.y = 3 * UNIT + (getAnim(anim) - 0.5) * UNIT;
	}

	var jigglyAng = fract(timeNow / 1000.0) * 2 * Math.PI;
	var jigglyDist = Math.sin(getAnim(timeNow / 240.0)) * 0.15 * UNIT;
	var jigglydx = Math.cos(jigglyAng) * jigglyDist;
	var jigglydz = Math.sin(jigglyAng) * jigglyDist;
	dungeon.lights[0].position.set(pl.position.x+jigglydx, pl.position.y + 0.1 * UNIT, pl.position.z+jigglydz);
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
	renderer.render(scene, pl.camera);
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
