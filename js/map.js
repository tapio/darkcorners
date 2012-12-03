"use strict";
var VOID = " ";
var OPEN = ".";
var WALL = "#";
var DIAG = "%";

function Map(w, h, data) {
	this.map = new Array(w * h);

	if (data && data.length && data instanceof Array) {
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				this.map[j * w + i] = data[j][i];
			}
		}
	} else if (data) {
		for (var k = 0; k < w * h; ++k) this.map[k] = data;
	}

	this.get = function(x, y, fallback) {
		if (x < 0 || x >= w || y < 0 || y >= h) return fallback || null;
		return this.map[y * w + x];
	};

	this.put = function(x, y, what) {
		if (x < 0 || x >= w || y < 0 || y >= h) return;
		this.map[y * w + x] = what;
	};

	this.toJSON = function() {
		var res = new Array(h);
		for (var j = 0; j < h; ++j) {
			res[j] = "";
			for (var i = 0; i < w; ++i) {
				res[j] += this.map[j * w + i];
			}
		}
		return res;
	};

	this.replace = function(oldval, newval) {
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				if (this.map[j * w + i] == oldval)
					this.map[j * w + i] = newval;
			}
		}
	};

	function floodFill(map, x, y, target, filler, skip) {
		var cell = map.get(x, y);
		if (cell != target && cell != skip) return;
		if (cell != skip)
			map.map[y * w + x] = filler;
		floodFill(map, x-1, y, target, filler, skip);
		floodFill(map, x+1, y, target, filler, skip);
		floodFill(map, x, y-1, target, filler, skip);
		floodFill(map, x, y+1, target, filler, skip);
	}

	this.fill = function(x, y, target, filler, skip) {
		floodFill(this, x, y, target, filler, skip);
	};

	function distSq(x1, y1, x2, y2) {
		var dx = x2 - x1, dy = y2 - y1;
		return dx * dx + dy * dy;
	}

	this.raycast = function(x1, y1, x2, y2, step) {
		step = step || 0.5;
		var angle = Math.atan2(y2 - y1, x2 - x1);
		var dx = Math.cos(angle) * step;
		var dy = Math.sin(angle) * step;
		while (distSq(x1, y1, x2, y2) > step * step) {
			if (this.map[(y1|0) * w + (x1|0)] == WALL)
				return false;
			x1 += dx;
			y1 += dy;
		}
		return true;
	};

	this.getWalkableMatrix = function() {
		var grid = new Array(h);
		for (var j = 0; j < h; ++j) {
			grid[j] = [];
			for (var i = 0; i < w; ++i) {
				grid[j].push(this.map[j * w + i] == WALL ? 1 : 0);
			}
		}
		return grid;
	};

}
