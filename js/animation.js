
function AnimationManager() {
	this.anims = [];
}

AnimationManager.prototype.createAnimatedMesh = function(geometry, materials, def) {
	var obj;
	// Handle material animation stuff
	for (var m = 0; m < materials.length; ++m) {
		if (def.animation.type === "morph") {
			materials[m].morphTargets = true;
			materials[m].morphNormals = true;
		} else if (def.animation.type === "bones") {
			materials[m].skinning = true;
		}
	}
	// Create the mesh
	var mat = materials.length > 1 ? new THREE.MeshFaceMaterial(materials) : materials[0];
	if (def.animation.type === "morph") {
		geometry.computeMorphNormals();
		obj = new THREE.MorphAnimMesh(geometry, mat);
		obj.duration = def.animation.duration;
		obj.time = obj.duration * Math.random();
	} else if (def.animation.type === "bones") {
		obj = new THREE.SkinnedMesh(geometry, mat); // TODO: useVertexTexture?
		THREE.AnimationHandler.add(geometry.animation);
		obj.animation = new THREE.Animation(obj, "walk");
	}
	this.anims.push(obj);
	return obj;
};

AnimationManager.prototype.update = function(dt) {
	for (var i = 0; i < this.anims.length; ++i) {
		var obj = this.anims[i];
		// Update SkinnedMesh animation state
		if (obj.animation) {
			if (!obj.animation.isPlaying && obj.animate) obj.animation.play();
			else if (obj.animation.isPlaying && !obj.animate) obj.animation.stop();
		}
		if (obj.dead) continue;
		// Update morph animation
		if (obj.updateAnimation && obj.animate)
			obj.updateAnimation(dt * 1000);
	}
	// Update skinned animations
	THREE.AnimationHandler.update(dt * 1000);
};
