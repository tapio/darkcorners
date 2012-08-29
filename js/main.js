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
	camera.position.y = 100;

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

	dungeon = new Dungeon(scene, [
		"####################",
		"#..*...............#",
		"#....#...........*.#",
		"#....#........######",
		"#....#*............#",
		"#..................#",
		"#...##.#######*....#",
		"#..................#",
		"#............#.....#",
		"#..........*.#.....#",
		"####################"
	]);

	renderer = new THREE.WebGLRenderer({ clearColor: 0xffffff, maxLights: 6 });
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = true;
	renderer.shadowMapSoft = true;
	renderer.physicallyBasedShading = true;

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
	animate();
	controls.update(clock.getDelta());
	renderer.render(scene, camera);
	stats.update();
}
