var tools = {};

tools.walls = {
	drawing: null,
	drawWalls: function() { currentTool = tools.walls; },
	mousedown: function(e) {
		if (e.button == 0) tools.walls.drawing = WALL;
		else if (e.button == 2) tools.walls.drawing = OPEN;
		else return;
		putMouse(e._x, e._y, tools.walls.drawing);
	},
	mousemove: function(e) {
		if (tools.walls.drawing) putMouse(e._x, e._y, tools.walls.drawing);
	},
	mouseup: function(e) {
		tools.walls.drawing = null;
	}
};
var currentTool = tools.walls;

tools.diagonals = {
	placeDiagonalWalls: function() { currentTool = tools.diagonals; },
	mousedown: function(e) {
		if (e.button == 2) putMouse(e._x, e._y, OPEN);
		else if (e.button == 0) {
			var c = 0;
			if (getMouse(e._x - s, e._y) == WALL) ++c;
			if (getMouse(e._x + s, e._y) == WALL) ++c;
			if (getMouse(e._x, e._y - s) == WALL) ++c;
			if (getMouse(e._x, e._y + s) == WALL) ++c;
			if (c == 2) putMouse(e._x, e._y, DIAG);
		}
	},
};

tools.start = {
	placeStart: function() { currentTool = tools.start; },
	mousedown: function(e) {
		if (e.button == 0) {
			putMouse(e._x, e._y, OPEN);
			level.start[0] = e._x / s;
			level.start[1] = e._y / s;
		}
	}
};

tools.exit = {
	placeExit: function() { currentTool = tools.exit; },
	mousedown: function(e) {
		if (e.button == 0) {
			putMouse(e._x, e._y, OPEN);
			level.exit[0] = e._x / s;
			level.exit[1] = e._y / s;
		}
	}
};

tools.light = {
	addLight: function() { currentTool = tools.light; },
	mousedown: function(e) {
		if (e.button == 0) {
			level.lights.push({ position: { x: e._x / s, z: e._y / s } });
		} else if (e.button == 2) {
			for (var i = 0; i < level.lights.length; ++i) {
				if (Math.abs(level.lights[i].position.x - e._x / s) < 0.75 &&
					Math.abs(level.lights[i].position.z - e._y / s) < 0.75) {
						level.lights.splice(i, 1);
						break;
				}
			}
		}
	}
};

tools.object = {
	object: "barrel",
	angle: 0,
	addObject: function() { currentTool = tools.object; },
	mousedown: function(e) {
		if (e.button == 0) {
			var obj = {
				name: tools.object.object,
				position: { x: e._x / s, z: e._y / s }
			}
			if (tools.object.angle !== 0) obj.angle = tools.object.angle;
			level.objects.push(obj);
		} else if (e.button == 2) {
			for (var i = 0; i < level.objects.length; ++i) {
				if (Math.abs(level.objects[i].position.x - e._x / s) < 0.75 &&
					Math.abs(level.objects[i].position.z - e._y / s) < 0.75) {
						level.objects.splice(i, 1);
						break;
				}
			}
		}
	}
};

tools.exportBase64 = function() {
	prepareExport();
	var b64 = window.btoa(JSON.stringify(level, null));
	document.getElementById("exported").value = b64;
	document.getElementById("exported").style.display = "block";
};

tools.exportJSON = function() {
	prepareExport();
	document.getElementById("exported").value = JSON.stringify(level, null, '\t');
	document.getElementById("exported").style.display = "block";
};

tools.importLevel = function(json) {
	var json = json || prompt("Paste here the level JSON (can be base64) to import:");
	if (!json || !json.length) return;
	try {
		if (json[0] !== '{') json = window.atob(json);
		json = JSON.parse(json);
	} catch (err) {
		alert("Import error: " + err);
		return;
	}
	level = json;
	level.map = new Map(level.width, level.depth, level.map);
	w = level.width; h = level.depth;
	// Discard y-coordinates
	for (var i = 0; i < level.lights.length; ++i)
		if (level.lights[i].position.y !== undefined)
			delete level.lights[i].position.y

	document.getElementById("exported").value = "";
	document.getElementById("exported").style.display = "none";
};

tools.test = function() {
	var url = "../game_dev.html#level=" + window.btoa(JSON.stringify(level));
	window.open(url, "_blank");
};

tools.previewObject = function() {
	var url = "model-viewer.html#" + tools.object.object;
	window.open(url, "_blank");
};
