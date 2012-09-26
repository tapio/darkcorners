
var maps = {
	test: {
		blocks: {
			"#": { wall: "stone-01" },
			".": { floor: "stone-02", ceiling: "stone-01" },
			",": { floor: "stone-03", ceiling: "stone-01" },
			"*": { floor: "stone-02", ceiling: "stone-01" },
			"o": { floor: "stone-02", ceiling: "stone-01" },
			"u": { floor: "stone-02", ceiling: "stone-01" },
			"t": { floor: "stone-02", ceiling: "stone-01" }
		},
		objects: {
			"o": { name: "barrel", collision: "cylinder", mass: 250 },
			"u": { name: "box", collision: "box", mass: 150 },
			"t": { name: "table-big", collision: "box", mass: 1000 }
		},
		map: [
			"####################",
			"#..*...............#",
			"#....#ooooooo....*.#",
			"#....#ooooooo.######",
			"#....#*.ooooo......#",
			"#..................#",
			"#...##.#######*....#",
			"#......u.o.........#",
			"#u...........#,,,,,#",
			"#u.....t...*.#,,,,,#",
			"####################"
		],
		start: [ 5, 8 ],
		gridSize: 2,
		roomHeight: 3
	}
};
