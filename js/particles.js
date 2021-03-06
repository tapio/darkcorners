"use strict";
// Most of the contents from this file is adapted from examples of firework.js
// http://jeromeetienne.github.com/fireworks.js/

DC.internal.novaTexture = loadTexture("assets/particles/nova.png", { alpha: true });
DC.internal.fireTexture = loadTexture("assets/particles/flame.png", { alpha: true });
DC.internal.fireGradient = Fireworks.createLinearGradient()
	.push(0.00, 0.00)
	.push(0.05, 1.00)
	.push(0.99, 1.00)
	.push(1.00, 0.00);

DC.ParticleMaterials = {
	teleporter: new THREE.ParticleBasicMaterial({
		color: 0x0088ee,
		size: 0.3,
		sizeAttenuation: true,
		vertexColors: true,
		map: DC.internal.novaTexture,
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		transparent: true
	}),
	simpleFire: new THREE.ParticleBasicMaterial({
		color: 0xee8800,
		size: 0.3,
		sizeAttenuation: true,
		vertexColors: true,
		map: Fireworks.ProceduralTextures.buildTexture(),
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		transparent: true
	}),
	texturedFire: new THREE.SpriteMaterial({
		map: DC.internal.fireTexture,
		useScreenCoordinates: false,
		depthTest: true,
		sizeAttenuation: true,
		scaleByViewport: false,
		blending: THREE.AdditiveBlending,
		transparent: true
	})
};


// Particle system initializer for simple particle flames
DC._particleSystemCreator = function(emitter, position, material) {
	var i, geometry = new THREE.Geometry();
	// Init vertices
	for (i = 0; i < emitter.nParticles(); i++)
		geometry.vertices.push(new THREE.Vector3());
	// Init colors
	geometry.colors = new Array(emitter.nParticles());
	for (i = 0; i < emitter.nParticles(); i++)
		geometry.colors[i] = new THREE.Color();
	// Init particle system
	var particleSystem = new THREE.ParticleSystem(geometry, material);
	particleSystem.dynamic = true;
	particleSystem.sortParticles = true;
	particleSystem.position = position;
	scene.add(particleSystem);
	return particleSystem;
};

// Create a simple fire emitter
DC.createSimpleFire = function(position) {
	var emitter = Fireworks.createEmitter({ nParticles: 30 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(20)
		.position(Fireworks.createShapeSphere(0, 0, 0, 0.1))
		.velocity(Fireworks.createShapePoint(0, 1, 0))
		.lifeTime(0.3, 0.6)
		.renderToThreejsParticleSystem({
			particleSystem: DC._particleSystemCreator(emitter, position, DC.ParticleMaterials.simpleFire)
		}).back()
	.start();
	return emitter;
};


// Create a teleporter emitter
DC.createTeleporterParticles = function(position) {
	var emitter = Fireworks.createEmitter({ nParticles: 30 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(20)
		.position(Fireworks.createShapeSphere(0, 0, 0, 0.3))
		.velocity(Fireworks.createShapePoint(0, 1, 0))
		.lifeTime(0.6, 1.2)
		.renderToThreejsParticleSystem({
			particleSystem: DC._particleSystemCreator(emitter, position, DC.ParticleMaterials.teleporter)
		}).back()
	.start();
	return emitter;
};


// Create a torch fire emitter
DC.createTexturedFire = function(parent) {
	var numSprites = 8;
	var spriteSize = 128;
	var emitter = Fireworks.createEmitter({ nParticles: 5 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(15)
		.position(Fireworks.createShapeSphere(0, 0.05, 0, 0.05))
		.velocity(Fireworks.createShapePoint(0, 1.5, 0))
		.lifeTime(0.1, 0.3)
		.friction(0.99)
		//.randomVelocityDrift(Fireworks.createVector(0.1,2,0))
		.createEffect('scale', {
				origin: spriteSize / 1000,
				factor: 1.02
			}).onBirth(function(particle) {
				var scale = this.opts.origin;
				particle.threejsObject3D.object3d.scale.set(scale * 1.5, scale * 4);
			}).onUpdate(function(particle, deltaTime) {
				particle.threejsObject3D.object3d.scale.multiplyScalar(this.opts.factor);
			}).back()
		.createEffect('rotation')
			.onBirth(function(particle) {
				particle.threejsObject3D.object3d.rotation = Math.random() * Math.PI * 2;
			}).back()
		.createEffect('opacity', {
				gradient: DC.internal.fireGradient
			}).onUpdate(function(particle) {
				var canonAge = particle.lifeTime.normalizedAge();
				particle.threejsObject3D.object3d.opacity = this.opts.gradient.get(canonAge);
			}).back()
		.renderToThreejsObject3D({
			container: parent,
			create: function() {
				// Unfortunately material clone is needed due to uvOffset in onUpdate :(
				var object3d = new THREE.Sprite(DC.ParticleMaterials.texturedFire.clone());
				object3d.material.uvScale.set(1, 1 / numSprites);
				return object3d;
			}
		})
		.createEffect("updateSpritesheet")
			.onUpdate(function(particle, deltaTime) {
				var canonAge = particle.lifeTime.normalizedAge();
				var imageIdx = Math.floor(canonAge * (numSprites));
				var uvOffsetY = imageIdx * 1 / numSprites;
				particle.threejsObject3D.object3d.material.uvOffset.set(0, uvOffsetY);
			}).back()
		.back()
	.start();
	return emitter;
};
