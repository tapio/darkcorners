
var maps = {
	test: {
		blocks: {
			"#": { wall: "stone-01" },
			".": { floor: "stone-02", ceiling: "stone-01" },
			",": { floor: "stone-03", ceiling: "stone-01" },
			"*": { floor: "stone-02", ceiling: "stone-01" },
			"o": { floor: "stone-02", ceiling: "stone-01" },
			"t": { floor: "stone-02", ceiling: "stone-01" }
		},
		map: [
			"####################",
			"#..*...............#",
			"#....#ooooooo....*.#",
			"#....#ooooooo.######",
			"#....#*.ooooo......#",
			"#..................#",
			"#...##.#######*....#",
			"#........o.........#",
			"#............#,,,,,#",
			"#......t...*.#,,,,,#",
			"####################"
		],
		start: [ 5, 8 ],
		gridSize: 3
	}
};
