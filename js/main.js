if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";
}

var container, stats;
var camera, controls, scene, renderer;
var dungeon;
var clock = new THREE.Clock();

init();
render();

function init() {
	container = document.getElementById('container');

	camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 20000);

	controls = new Controls(camera);
	controls.movementSpeed = 500;
	controls.lookSpeed = 0.5;
	controls.lookVertical = true;
	controls.constrainVerticalLook = true;
	controls.verticalMin = 1.3;
	controls.verticalMax = 1.9;
	controls.freezeObjectY = true;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x000000, 0.0005);

	dungeon = new Dungeon(scene, camera, [
		"####################",
		"#..*...............#",
		"#....#...........*.#",
		"#....#........######",
		"#....#*............#",
		"#..................#",
		"#...##.#######*....#",
		"#..................#",
		"#............#...S.#",
		"#..........*.#.....#",
		"####################"
	]);

	renderer = new THREE.WebGLRenderer({ clearColor: 0x000000, maxLights: 6, antialias: true });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = true;

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

	window.addEventListener('resize', onWindowResize, false);
	document.getElementById("lockmouse").addEventListener('click', container.webkitRequestPointerLock, false);
	document.addEventListener('pointerlockchange', onPointerLockChange, false);
	document.addEventListener('webkitpointerlockchange', onPointerLockChange, false);
	document.addEventListener('mozpointerlockchange', onPointerLockChange, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls.handleResize();
}

function onPointerLockChange() {
	controls.pointerLockEnabled = !controls.pointerLockEnabled;
}

function animate() {
	function getAnim(time) { return Math.abs(time - (time|0) - 0.5) * 2.0; }
	var timeNow = new Date().getTime();
	for (var i = 0; i < dungeon.lights.length; ++i) {
		var anim = timeNow / (1000.0 + i);
		anim = 0.5 * getAnim(anim);
		dungeon.lights[i].intensity = anim;
	}
}

function render() {
	requestAnimationFrame(render);
	controls.update(clock.getDelta());
	animate();
	renderer.render(scene, camera);
	stats.update();
}

function dumpInfo() {
	var gl = renderer.context;
	console.log("Version: " + gl.getParameter(gl.VERSION));
	console.log("Shading language: " + gl.getParameter(gl.SHADING_LANGUAGE_VERSION));
	console.log("Vendor: " + gl.getParameter(gl.VENDOR));
	console.log("Renderer: " + gl.getParameter(gl.RENDERER));
	console.log("Max varying vectors: " + gl.getParameter(gl.MAX_VARYING_VECTORS));
	console.log("Max vertex attribs: " + gl.getParameter(gl.MAX_VERTEX_ATTRIBS));
	console.log("Max vertex uniform vectors: " + gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
	console.log("Max fragment uniform vectors: " + gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS));
	console.log("Max renderbuffer size: " + gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
	console.log("Max texture size: " + gl.getParameter(gl.MAX_TEXTURE_SIZE));
	console.log("Max cube map texture size: " + gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE));
	console.log("Max texture image units: " + gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS));
	console.log("Max vertex texture units: " + gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS));
	console.log("Max combined texture units: " + gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS));
	console.log("Max viewport dims: " + gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0] + "x" + gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]);
}
