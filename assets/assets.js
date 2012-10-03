var assets = {
	objects: {
		"rock-01": { collision: "sphere", mass: 400, randScale: 0.3 },
		"rock-02": { collision: "box", mass: 400, randScale: 0.3 },
		"rock-03": { collision: "box", mass: 400, randScale: 0.3 },
		"rock-04": { collision: "box", mass: 500, randScale: 0.3 },
		"barrel": { collision: "cylinder", mass: 250 },
		"box": { collision: "box", mass: 150 },
		"netted-jar": { collision: "cylinder", mass: 100 },
		"table-big": { collision: "box", mass: 1000 },
		"table-old": { collision: "box", mass: 800 },
		"chair-01": { collision: "box", mass: 200 },
		"pillar-greek": { collision: "cylinder", mass: 0 }
	},
	materials: {
		"rock-01": { roughness: 0.15 },
		"rock-02": { roughness: 0.15 },
		"rock-03": { roughness: 0.15 },
		"rock-04": { roughness: 0.15 }
	},
	environments: {
		"cave": {
			wall: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			floor: [ "sand-01", "sand-02", "sand-03", "sand-04" ],
			ceiling: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			objects: [ "rock-01", "rock-02", "rock-03", "rock-04" ]
		},
		"mine": {
			wall: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			floor: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			ceiling: [ "rock-01", "rock-02", "rock-03", "rock-04" ],
			objects: [ "rock-01", "rock-02", "rock-03", "rock-04", "barrel", "box", "netted-jar", "table-old" ]
		},
		"dungeon": {
			wall: [ "stone-01", "stone-02", "stone-03" ],
			floor: [ "stone-floor-02", "stone-floor-05" ],
			ceiling: [ "stone-01" ],
			objects: [ "barrel", "box", "netted-jar", "table-old", "chair-01" ]
		},
		"castle": {
			wall: [ "stone-01", "tiles-01", "tiles-02" ],
			floor: [ "stone-floor-01", "stone-floor-03", "stone-floor-04", "stone-floor-06", "wood-floor-01" ],
			ceiling: [ "stone-01" ],
			objects: [ "barrel", "netted-jar", "table-big", "chair-01" ]
		},
		"temple": {
			wall: [ "stone-01", "tiles-01", "tiles-02" ],
			floor: [ "stone-floor-01", "stone-floor-03", "stone-floor-04", "stone-floor-06", "wood-floor-01" ],
			ceiling: [ "stone-01" ],
			objects: [ "pillar-greek", "pillar-greek", "netted-jar", "table-old", "chair-01" ]
		}
	}
};
