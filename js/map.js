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
}
