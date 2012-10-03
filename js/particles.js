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

function initFireTextures() {
	var urls = [];
	for (var i = 17; i <= 24; ++i)
		urls.push("assets/particles/fire/flame" + i + ".jpg");
}

function createTexturedFire(position) {
	var emitter	= Fireworks.createEmitter({ nParticles: 30 });
	emitter.bindTriggerDomEvents()
		.effectsStackBuilder()
			.spawnerSteadyRate(20)
			.position(Fireworks.createShapeBox(0, 0, 0, 2, 0.1, 0.1))
			.velocity(Fireworks.createShapeSphere(0, 20, 0, 1))
			.lifeTime(0.8, 1.2)
			.friction(0.99)
			.randomVelocityDrift(Fireworks.createVector(10,100,0))
			.createEffect('scale', {
					origin: 1/30,
					factor: 1.02
				}).onBirth(function(particle){
					var object3d = particle.get('threejsObject3D').object3d;
					var scale = this.opts.origin;
					object3d.scale.set(scale*1.5, scale*4)
				}).onUpdate(function(particle, deltaTime){
					var object3d = particle.get('threejsObject3D').object3d;
					object3d.scale.multiplyScalar(this.opts.factor);
				}).back()
			.createEffect('rotation')
				.onBirth(function(particle){
					var object3d = particle.get('threejsObject3D').object3d;
					object3d.rotation = Math.random()*Math.PI*2;
				}).back()
			.createEffect('opacity', {
					gradient: Fireworks.createLinearGradient()
							.push(0.00, 0.00)
							.push(0.05, 1.00)
							.push(0.99, 1.00)
							.push(1.00, 0.00)
				}).onUpdate(function(particle){
					var object3d = particle.get('threejsObject3D').object3d;
					var canonAge = particle.get('lifeTime').normalizedAge();
					object3d.opacity = this.opts.gradient.get(canonAge);
				}).back()
			.renderToThreejsObject3D({
				container: container,
				create: function(){
					var object3d = new THREE.Sprite({
						//color: 0xaa66ee,
						useScreenCoordinates: false,
						map: texture,
						blending: THREE.AdditiveBlending,
						transparent: true
					});
					//object3d.opacity= 0.8;
					object3d.uvScale.set(1, 1/urls.length)
					return object3d;
				}
			})
			.createEffect("updateSpritesheet")
				.onUpdate(function(particle, deltaTime){
					var object3d = particle.get('threejsObject3D').object3d;
					var canonAge = particle.get('lifeTime').normalizedAge();
					var imageIdx = Math.floor(canonAge * (urls.length));
					var uvOffsetY = imageIdx * 1/urls.length;
					object3d.uvOffset.set(0, uvOffsetY)
				}).back()
			.back()
		.start();
	return emitter;
}
