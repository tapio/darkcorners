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
	controls.movementSpeed = 1000;
	controls.lookSpeed = 0.125;
	controls.lookVertical = true;
	controls.constrainVertical = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.0;
	controls.lockY = true;

	scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0x777777, 0.0005);

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
		"####################",
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

	window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	controls.handleResize();
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
