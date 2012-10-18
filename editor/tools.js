var tools = {};

tools.walls = {
	"Draw walls": function() {
		currentTool = tools.walls;
		canvas.style.cursor = "default";
	},
	drawing: null,
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
	"Place diagonal walls": function() {
		currentTool = tools.diagonals;
		canvas.style.cursor = "default";
	},
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
	"Place start": function() {
		currentTool = tools.start;
		canvas.style.cursor = "crosshair";
	},
	mousedown: function(e) {
		if (e.button == 0) {
			putMouse(e._x, e._y, OPEN);
			level.start[0] = e._x / s;
			level.start[1] = e._y / s;
		}
	}
};

tools.exit = {
	"Place exit": function() {
		currentTool = tools.exit;
		canvas.style.cursor = "crosshair";
	},
	mousedown: function(e) {
		if (e.button == 0) {
			putMouse(e._x, e._y, OPEN);
			level.exit[0] = e._x / s;
			level.exit[1] = e._y / s;
		}
	}
};

tools.light = {
	"Add light": function() {
		currentTool = tools.light;
		canvas.style.cursor = "crosshair";
	},
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
	"Add object": function() {
		currentTool = tools.object;
		canvas.style.cursor = "crosshair";
	},
	object: "barrel",
	objects: [], // Populated from assets.js
	angle: 0,
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

tools.trigger = {
	"Add trigger": function() {
		currentTool = tools.trigger;
		canvas.style.cursor = "crosshair";
	},
	type: "message",
	types: [ "message" ],
	mousedown: function(e) {
		if (e.button == 0) {
			var trig = {
				type: tools.trigger.type,
				position: { x: e._x / s, z: e._y / s }
			}
			if (tools.trigger.type === "message") {
				var msg = prompt("Please enter the message to be triggered:");
				if (!msg) return;
				trig.message = msg;
			} else return;
			level.triggers.push(trig);
		} else if (e.button == 2) {
			for (var i = 0; i < level.triggers.length; ++i) {
				if (Math.abs(level.triggers[i].position.x - e._x / s) < 0.75 &&
					Math.abs(level.triggers[i].position.z - e._y / s) < 0.75) {
						level.triggers.splice(i, 1);
						break;
				}
			}
		}
	}
};

tools["Export base64"] = function() {
	prepareExport();
	var b64 = window.btoa(JSON.stringify(level, null));
	document.getElementById("exported").value = b64;
	document.getElementById("exported").style.display = "block";
};

tools["Export JSON"] = function() {
	prepareExport();
	document.getElementById("exported").value = JSON.stringify(level, null, '\t');
	document.getElementById("exported").style.display = "block";
};

tools["Import level"] = function(json) {
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

tools["Test"] = function() {
	var url = "../game_dev.html#level=" + window.btoa(JSON.stringify(level));
	window.open(url, "_blank");
};

tools["Preview object"] = function() {
	var url = "model-viewer.html#" + tools.object.object;
	window.open(url, "_blank");
};
