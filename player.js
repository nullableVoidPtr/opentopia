export var units = {
	base: {
		warrior: {
			id: "units.base.warrior",
			name: "Warrior",
			health: 10,
			attack: 2,
			defense: 2,
			cost: 2,
			movement: 1,
			range: 1
		},
	},
}

export class Unit {
	constructor(type, x, y) {
		Object.assign(this, units.base.warrior, type);
		this.x = x;
		this.y = y;
		this.moved = true;
	}
}

export default class Player {
	constructor(startingCity, options={}) {
		Object.assign(this, options);
		this.units = [];
		this.resources = 5;
		this.score = 0;
	}
	addUnit(unit) {
		this.units.push(unit);
	};
	deleteUnit(unit) {this.units = this.units.filter((u) => u !== unit)}
};