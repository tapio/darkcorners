/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * @author tapio / http://tapio.github.com/
 */

// Based on THREE.FirstPersonControls
Controls = function (object, domElement) {
	this.object = object;
	this.target = new THREE.Vector3(0, 0, 0);
	this.domElement = (domElement !== undefined) ? domElement : document;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;
	this.lookVertical = true;
	this.autoForward = false;
	this.mouseEnabled = true;
	this.active = true;

	this.constrainVerticalLook = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.pointerLockEnabled = false;
	this.mouseFallback = false;

	this.mouseX = 0;
	this.mouseY = 0;

	var lat = 0, lon = 0, phi = 0, theta = 0;
	var moveForward = false, moveBackward = false;
	var moveLeft = false, moveRight = false;
	var moveUp = false, moveDown = false;
	var viewHalfX = 0, viewHalfY = 0;

	if (this.domElement !== document) {
		this.domElement.setAttribute('tabindex', -1);
	}

	//

	this.reset = function() {
		lat = 0; lon = 0;
	};

	this.handleResize = function () {
		if (this.domElement === document) {
			viewHalfX = window.innerWidth / 2;
			viewHalfY = window.innerHeight / 2;
		} else {
			viewHalfX = this.domElement.offsetWidth / 2;
			viewHalfY = this.domElement.offsetHeight / 2;
		}
	};

	this.onMouseDown = function (event) {
		if (this.domElement !== document) {
			this.domElement.focus();
		}
		event.preventDefault();
		//event.stopPropagation();
		if (this.mouseEnabled) {
			switch (event.button) {
				case 0: break;
				case 2: break;
			}
		}
	};

	this.onMouseUp = function (event) {
		event.preventDefault();
		//event.stopPropagation();
		if (this.mouseEnabled) {
			switch (event.button) {
				case 0: break;
				case 2: break;
			}
		}
	};

	this.onMouseMove = function (event) {
		if (this.pointerLockEnabled) {
			this.mouseX = event.movementX || event.webkitMovementX || event.mozMovementY || 0;
			this.mouseY = event.movementY || event.webkitMovementY || event.mozMovementY || 0;
			this.mouseX *= 20;
			this.mouseY *= 20;
		} else if (this.domElement === document) {
			this.mouseX = event.pageX - viewHalfX;
			this.mouseY = event.pageY - viewHalfY;
		} else {
			this.mouseX = event.pageX - this.domElement.offsetLeft - viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - viewHalfY;
		}
	};

	this.onKeyDown = function (event) {
		//event.preventDefault();
		switch (event.keyCode) {
			case 38: /*up*/
			case 87: /*W*/ moveForward = true; break;
			case 37: /*left*/
			case 65: /*A*/ moveLeft = true; break;
			case 40: /*down*/
			case 83: /*S*/ moveBackward = true; break;
			case 39: /*right*/
			case 68: /*D*/ moveRight = true; break;
			case 81: /*Q*/ this.active = !this.active; break;
		}
	};

	this.onKeyUp = function (event) {
		switch(event.keyCode) {
			case 38: /*up*/
			case 87: /*W*/ moveForward = false; break;
			case 37: /*left*/
			case 65: /*A*/ moveLeft = false; break;
			case 40: /*down*/
			case 83: /*S*/ moveBackward = false; break;
			case 39: /*right*/
			case 68: /*D*/ moveRight = false; break;
		}
	};

	this.update = function(delta) {
		if (!this.active) return;

		var actualMoveSpeed = delta * this.movementSpeed,
			actualLookSpeed = this.mouseEnabled ? delta * this.lookSpeed : 0,
			cameraPosition = this.object.position;

		// Looking

		if (this.pointerLockEnabled ||
			(this.mouseFallback && this.mouseX * this.mouseX + this.mouseY * this.mouseY > 5000))
			{
			lon += this.mouseX * actualLookSpeed;
			if (this.lookVertical)
				lat -= this.mouseY * actualLookSpeed;
		}

		lat = Math.max(-85, Math.min(85, lat));
		phi = (90 - lat) * Math.PI / 180;
		theta = lon * Math.PI / 180;

		if (this.constrainVerticalLook)
			phi = THREE.Math.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);

		this.target.x = cameraPosition.x + 100 * Math.sin(phi) * Math.cos(theta);
		this.target.y = cameraPosition.y + 100 * Math.cos(phi);
		this.target.z = cameraPosition.z + 100 * Math.sin(phi) * Math.sin(theta);

		if (this.pointerLockEnabled) {
			this.mouseX = 0;
			this.mouseY = 0;
		}

		this.object.lookAt(this.target);

		// Movement

		if (moveForward || (this.autoForward && !moveBackward)) {
			this.object.translateZ(-actualMoveSpeed);
		} else if (moveBackward) {
			this.object.translateZ(actualMoveSpeed);
		}

		if (moveLeft) {
			this.object.translateX(-actualMoveSpeed);
		} else if (moveRight) {
			this.object.translateX(actualMoveSpeed);
		}

		if (moveUp) {
			this.object.translateY(actualMoveSpeed);
		} else if (moveDown) {
			this.object.translateY(-actualMoveSpeed);
		}

	};


	this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
	this.domElement.addEventListener('mousemove', bind(this, this.onMouseMove), false);
	this.domElement.addEventListener('mousedown', bind(this, this.onMouseDown), false);
	this.domElement.addEventListener('mouseup', bind(this, this.onMouseUp), false);
	this.domElement.addEventListener('keydown', bind(this, this.onKeyDown), false);
	this.domElement.addEventListener('keyup', bind(this, this.onKeyUp), false);

	function bind(scope, fn) {
		return function () {
			fn.apply(scope, arguments);
		};
	}

	this.handleResize();
};
