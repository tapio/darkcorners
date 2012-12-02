var assets = {
	objects: {
		"fern-01": { randScale: 0.3, noShadows: true },
		"fern-02": { randScale: 0.3, noShadows: true },
		"plant-01": { randScale: 0.3, noShadows: true },
		"plant-02": { randScale: 0.3, noShadows: true },
		"plant-03": { randScale: 0.3, noShadows: true },
		"plant-04": { randScale: 0.3, noShadows: true },
		"plant-05": { randScale: 0.3, noShadows: true },
		"rock-01": { collision: "sphere", mass: 400, randScale: 0.4 },
		"rock-02": { collision: "box", mass: 400, randScale: 0.4 },
		"rock-03": { collision: "box", mass: 400, randScale: 0.4 },
		"rock-04": { collision: "box", mass: 500, randScale: 0.4 },
		"barrel": { collision: "cylinder", mass: 250 },
		"box": { collision: "box", mass: 150 },
		"bucket-broken": { collision: "cylinder", mass: 50 },
		"netted-jar": { collision: "cylinder", mass: 100 },
		"vase-01": { collision: "cylinder", mass: 75 },
		"table-big": { collision: "box", mass: 1000 },
		"table-old": { collision: "box", mass: 800 },
		"chair-01": { collision: "box", mass: 200 },
		"bench-church": { collision: "box", mass: 1000 },
		"torch-standing": { collision: "cylinder", mass: 150 },
		"mine-cart": { collision: "box", mass: 900 },
		"obelisk-01": { collision: "box", mass: 0 },
		"obelisk-02": { collision: "box", mass: 0 },
		"pillar-broken-01": { collision: "cylinder", mass: 0 },
		"pillar-broken-02": { collision: "cylinder", mass: 0 },
		"pillar-greek": { collision: "cylinder", mass: 0 },
		"forge": { collision: "concave", mass: 0 },
		"door-barred": { collision: "box", mass: 400, door: true },
		"teleporter": { collision: "cylinder", mass: 0 }
	},
	items: {
		"key": {},
		"knife": {},
		"health-potion": {},
		"mana-potion": {}
	},
	lights: {
		"torch-hanging-01": { type: "ceiling", offset: { x: 0, y: -0.2, z: 0 } },
		"torch-hanging-02": { type: "ceiling", offset: { x: 0, y: -0.2, z: 0 } },
		"torch": { type: "wall", offset: { x: 0, y: -0.2, z: 0 } }
	},
	sounds: { },
	materials: {
		"grass-01": {},
		"grass-02": {},
		"grass-03": {},
		"grass-04": {},
		"moss-01": {},
		"moss-02": {},
		"rock-01": { roughness: 0.15 },
		"rock-02": { roughness: 0.15 },
		"rock-03": { roughness: 0.15 },
		"rock-04": { roughness: 0.15 },
		"rock-05": {},
		"sand-01": {},
		"sand-02": {},
		"sand-03": {},
		"sand-04": {},
		"stone-01": {},
		"stone-02": {},
		"stone-03": {},
		"stone-floor-01": {},
		"stone-floor-02": {},
		"stone-floor-03": {},
		"stone-floor-04": {},
		"stone-floor-05": {},
		"stone-floor-06": {},
		"tiles-01": {},
		"tiles-02": {},
		"wood-floor-01": {}
	},
	monsters: {
		"cerberus": { collision: "box", character: { speed: 120 }, animation: { duration: 750 } },
		"spider": { collision: "box", character: { speed: 120 }, animation: { duration: 750 } },
		"minotaur": { collision: "box", character: { speed: 400 }, animation: { duration: 750 } }
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
			objects: [ "mine-cart", "rock-01", "rock-02", "rock-03", "rock-04", "barrel", "box", "netted-jar", "table-old" ]
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
