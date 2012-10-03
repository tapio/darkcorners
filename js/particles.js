// Most of the contents from this file is adapted from examples of firework.js
// http://jeromeetienne.github.com/fireworks.js/


// Particle system initializer for simple particle flames
function particleSystemCreator(emitter, position) {
	var i, geometry = new THREE.Geometry();
	// Init vertices
	for (i = 0; i < emitter.nParticles(); i++)
		geometry.vertices.push(new THREE.Vector3());
	// Init colors
	geometry.colors = new Array(emitter.nParticles());
	for (i = 0; i < emitter.nParticles(); i++)
		geometry.colors[i] = new THREE.Color();
	// Init material
	var texture	= Fireworks.ProceduralTextures.buildTexture();
	var material = new THREE.ParticleBasicMaterial({
		color: new THREE.Color(0xee8800).getHex(),
		size: 0.3,
		sizeAttenuation: true,
		vertexColors: true,
		map: texture,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		transparent: true
	});
	// Init particle system
	var particleSystem = new THREE.ParticleSystem(geometry, material);
	particleSystem.dynamic = true;
	particleSystem.sortParticles = true;
	particleSystem.position = position;
	scene.add(particleSystem);
	return particleSystem;
}

// Create an emitter
function createSimpleFire(position) {
	var emitter = Fireworks.createEmitter({ nParticles: 30 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(20)
		.position(Fireworks.createShapeSphere(0, 0, 0, 0.1))
		.velocity(Fireworks.createShapePoint(0, 1, 0))
		.lifeTime(0.3, 0.6)
		.renderToThreejsParticleSystem({
			particleSystem: particleSystemCreator(emitter, position)
		}).back()
	.start();
	return emitter;
}
