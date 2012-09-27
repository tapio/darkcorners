var assets = {
	objects: {
		"barrel": { collision: "cylinder", mass: 250 },
		"box": { collision: "box", mass: 150 },
		"table-big": { collision: "box", mass: 1000 }
	},
	environments: {
		"dungeon": {
			wall: [ "stone-01"],
			floor: [ "stone-02", "stone-03" ],
			ceiling: [ "stone-01" ],
			objects: [ "barrel", "box" ]
		},
	}
};
