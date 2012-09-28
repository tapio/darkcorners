var assets = {
	objects: {
		"barrel": { collision: "cylinder", mass: 250 },
		"box": { collision: "box", mass: 150 },
		"table-big": { collision: "box", mass: 1000 }
	},
	environments: {
		"cave": {
			wall: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			floor: [ "sand-01", "sand-02", "sand-03", "sand-04" ],
			ceiling: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			objects: [ "barrel", "box" ]
		},
		"mine": {
			wall: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			floor: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			ceiling: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			objects: [ "barrel", "box" ]
		},
		"dungeon": {
			wall: [ "stone-01", "stone-02", "stone-03" ],
			floor: [ "stone-floor-02", "stone-floor-05" ],
			ceiling: [ "stone-01" ],
			objects: [ "barrel", "box" ]
		},
		"castle": {
			wall: [ "stone-01", "tiles-01", "tiles-02" ],
			floor: [ "stone-floor-01", "stone-floor-03", "stone-floor-04", "wood-floor-01" ],
			ceiling: [ "stone-01" ],
			objects: [ "barrel", "table-01", "table-01" ]
		},
	}
};
