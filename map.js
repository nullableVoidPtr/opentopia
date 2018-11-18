import Player, {Unit, units} from "./player.js"
import Queue from "./queue.js"

export var terrains = {
	base: {
		water: {
			id: "terrains.base.water",
			name: "Water",
		},
		ocean: {
			id: "terrains.base.ocean",
			name: "Ocean",
		},
		field: {
			id: "terrains.base.field",
			name: "Field",
		},
		forest: {
			id: "terrains.base.forest",
			name: "Forest",
		},
		mountain: {
			id: "terrains.base.mountain",
			name: "Mountain",
			movementCost: 3,
		},
	}
};

export var resources = {
	base: {
		fruit: {
			id: "resources.base.fruit",
			terrains: [terrains.base.field],
		},
		crop: {
			id: "resources.base.crop",
			terrains: [terrains.base.field],
		},
		fish: {
			id: "resources.base.fish",
			terrains: [terrains.base.water],
		},
		whale: {
			id: "resources.base.whale",
			terrains: [terrains.base.ocean],
		},
		game: {
			id: "resources.base.game",
			terrains: [terrains.base.forest],
		},
		metal: {
			id: "resources.base.metal",
			terrains: [terrains.base.mountain],
		},
	}
};

export var buildings = {
	base: {
		city: {
			id: "buildings.base.city",
			name: "City"
		},
		ruin: {
			id: "buildings.base.ruin",
			name: "ruin"
		}
	}
};

export const default_options = {
	width: 12,
	height: 12,
	abundance: 1,
	roughness: 0.2,
	moisture: 0.5,
	smoothIterations: 3,
};

export var default_continent_nature = {
	vegetation: 0.4,
	roughness: 0.15,
	moisture: 0.0,
	quarry: 0.5,
	fruit: 0.5,
	fish: 0.5,
	metal: 0.5,
	crop: 0.5,
	whale: 0.4,
};

export var test_continents = [
	{
		biome: "test1",
		nature: {
			metal:0.05,
			crop: 0.05,
			fruit: 1,
		},
	},
	{
		biome: "test2",
		nature: {
			roughness: 0.075,
			moisture: 0.4,
			fish: 0.75,
		},
	},
	{
		biome: "test3",
		nature: {
			moisture: 0.3,
			forest: 0.2,
		},
	},
	{
		biome: "test4",
		nature: {
			forest: 0.2,
			moisture: 0.1,
		},
	},
];

export class Building {
	constructor(type = buildings.base.city, level = 0) {
		this.type = type;
		this.level = level
	}
}

export class Tile {
	constructor() {
		this.altitude = -1;
		this.terrain = terrains.base.water;
		this.building = undefined;
		this.resource = undefined;
	}
	
	get isWater() {
		return [terrains.base.water, terrains.base.ocean].includes(this.terrain);
	}
	
	get hasBuilding() {
		return (this.building !== undefined) ? true : false;
	}
	
	get movementCost() {
		return (this.terrain.movementCost) ? this.terrain.movementCost : 1;
	}
}

export class TileResult {
	constructor(x, y, tile) {
		this.x = x;
		this.y = y;
		this.tile = tile;
	}
}

export class Continent {
	constructor() {
		this.tiles = [];
		this._nature = default_continent_nature;
	}
	
	randomTile(retTileResult = false) {
		return (retTileResult) ? this.tiles[Math.floor(Math.random() * this.tiles.length)] : this.tiles[Math.floor(Math.random() * this.tiles.length)].tile;
	}
	
	set nature(n) {
		Object.assign(this._nature, n);
	}

	get nature() {
		return this._nature;
	}
}

export default class Map {
	constructor(options = default_options) {
		Object.assign(this, default_options, options);
		if (!options.tiles) {
			this.tiles = Array.from(new Array(this.width), () => 
				Array.from(new Array(this.height), 
					() => new Tile()
				)
			);
			for (var fieldNo = Math.floor(this.width * this.height * (1 - this.moisture)); fieldNo; fieldNo--) {
				var tile = this.randomTile();
				while (!tile.isWater) tile = this.randomTile();
				tile.altitude = 1;
				tile.terrain = terrains.base.field;
			}
		}
		for (; this.smoothIterations--; this.vichniacVote());
		this.players = [];
	}
	
	region(x, y, radius, retTileResult = false) {
		var region = [];
		for (var relativeX = -Math.floor(radius); relativeX <= radius; relativeX++) {
			if (x + relativeX < 0 || x + relativeX >= this.width) continue;
			for (var relativeY = -Math.floor(radius); relativeY <= radius; relativeY++) {
				if (y + relativeY < 0 || y + relativeY >= this.height) continue; else region.push((retTileResult) ? new TileResult(x+relativeX, y+relativeY, this.tiles[x+relativeX][y+relativeY]) : this.tiles[x+relativeX][y+relativeY]);
			}
		}
		return region;
	}
	
	randomTile(retTileResult = false) {
		var x = Math.floor((Math.random() * (this.width)));
		var y = Math.floor((Math.random() * (this.height)));
		return (retTileResult) ? new TileResult(x, y, this.tiles[x][y]) : this.tiles[x][y];
	}
	
	isolatedTile(retTileResult = false) {
		var potentialTiles = [];
		for (var x = 1; x < this.width - 1; x++) {
			for (var y = 1; y < this.height - 1; y++) {
				var result = new TileResult(x, y, this.tiles[x][y]);
				if (result.tile.terrain == terrains.base.mountain || result.tile.isWater) {
					continue;
				}
				if (this.region(x, y, 2).some((t) =>
					t.hasBuilding
				)) {
					continue;
				}
				potentialTiles.push(retTileResult ? result : result.tile);
			}
		}
		return potentialTiles[Math.floor(Math.random() * potentialTiles.length)];
	}
	
	neighbours(x, y, retTileResult = false) {
		return this.region(x, y, 1, retTileResult);
	}
	
	nearBuilding(x, y, radius) {
		return this.region(x, y, radius).some((tile) => tile.hasBuilding);
	}
	
	adjacent(x, y, retTileResult = false) {
		return [[x, y - 1], [x - 1, y], [x + 1, y], [x, y + 1]].filter((c) => 
			c[0] >= 0 && c[0] < this.width && c[1] >= 0 && c[1] < this.height
		).map((c) => 
			retTileResult ? new TileResult(c[0], c[1], this.tiles[c[0]][c[1]]) : this.tiles[c[0]][c[1]]
		);
	}
	
	landAdjacent(x, y) {
		return this.adjacent(x, y, true).some((t) =>
			!this.tiles[t.x][t.y].isWater
		);
	}
	
	vichniacVote() {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				var neighbours = this.neighbours(x, y);
				var noWetNeighbours = neighbours.reduce((count, neighbour) => 
					(neighbour.isWater) ? count + 1 : count
				, 0);
				this.tiles[x][y].terrain = (noWetNeighbours / neighbours.length > 0.5) ? terrains.base.water : terrains.base.field;
				this.tiles[x][y].altitude = (noWetNeighbours / neighbours.length > 0.5) ? -1 : 1;
			}
		}
	}
	
	createOcean() {
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				this.tiles[x][y].terrain = (this.tiles[x][y].isWater) ? ((this.landAdjacent(x, y)) ? terrains.base.water : terrains.base.ocean) : this.tiles[x][y].terrain
			}
		}
	}
	
	potentialCityTile(retTileResult = false) {
		var border = 2;
		var result;
		var distance = 0;
		for (var i = 0; i < this.width * this.height; i++) {
			var x = border + Math.floor((this.width - (border * 2)) * Math.random());
			var y = border + Math.floor((this.height - (border * 2)) * Math.random());
			var rand = this.tiles[x][y];
			if (!rand.isWater) {
				var dist = this.distanceToNearestBuilding(x, y);
				if (!result || dist > distance) {
					distance = dist;
					result = new TileResult(x, y, rand);
				}
			}
		}
		return (retTileResult) ? result : result.tile;
	}
	
	distanceToNearestBuilding(x, y) {
		return Math.round(this.tiles.reduce((distance, col, i) =>
			col.reduce((dist, tile, j) => 
				(tile.hasBuilding) ? Math.min(dist, Math.sqrt(x-i ** 2 + y-j ** 2)) : dist
			, distance)
		, Infinity));
	}
	
	addVillages() {
		for (var i = 0; i < 200; i++) {
			var village = this.isolatedTile();
			if (village !== undefined) {
				village.terrain = terrains.base.field;
				village.resource = undefined;
				village.building = new Building();
			} else {
				break;
			}
		}
	}
	
	addResources() {
		var visited = [];
		for (var x = 0; x < this.width; x++) {
			for (var y = 0; y < this.height; y++) {
				if (this.tiles[x][y].hasBuilding && this.tiles[x][y].building.type == buildings.base.city) {
					for (var neighbour of this.neighbours(x, y)) {
						if (!visited.contains(neighbour)) {
							visited.push(neighbour);
							if (Math.random() < this.richness && neighbour !== this.tiles[x][y] && !neighbour.resource) {
								addResource(x, y);
							}
						}
					}
					for (var near of region(x, y, 2)) {
						if (!visited.contains(near)) {
							visited.push(near);
							if (Math.random() < this.richness / 3 && neighbour !== this.tiles[x][y] && !neighbour.resource) {
								addResource(x, y);
							}
						}
					}
				}
			}
		}
	}
	
	addResource(x, y) {
		var possibleResources = resources.base.filter((res) =>
			res.terrains.contains(this.tiles[x][y].terrain)
		);
		this.tiles[x][y].resource = possibleResources[Math.floor(Math.random() * possibleResources.length)];
	}
	
	addRuins(noRuins) {
		var noWaterRuins = 0;
		for (var i = 0; i < noRuins; i++) {
			while (true) {
				var ruin = this.randomTile(true);
				if (!(ruin.tile.hasBuilding || nearBuilding(ruin.x, ruin.y, 1) || ruin.tile.isWater && noWaterRuins > noRuins / 3)) {
					continue;
				} else {
					ruin.type.building = new Building(buildings.base.ruin);
					if (ruin.tile.isWater) {
						noWaterRuins++;
					}
					break;
				}
			}
		}
	}
	
	addPlayers(playerParameters) {
		this.continents = [];
		for (var p of playerParameters) {
			var startingCity = this.potentialCityTile(true);
			startingCity.tile.terrain = terrains.base.field;
			startingCity.tile.altitude = 1;
			startingCity.tile.resource = undefined;
			startingCity.tile.building = new Building();
			this.players.unshift(new Player(startingCity.tile, {style: p.style}));
			var continent = new Continent();
			if (p.nature) {
				continent.nature = p.nature;
			}
			continent.style = p.style;
			continent.tiles.push(startingCity);
			this.continents.push(continent);
			this.players[0].name = p.name;
			this.players[0].addUnit(new Unit(units.base.warrior, startingCity.x, startingCity.y));
			this.players[0].units[0].moved = false;
			startingCity.tile.building.owner = this.players[0];
		}
		this.players.reverse();
		var noProcessedTiles = playerParameters.length;
		while (noProcessedTiles < this.width * this.height) {
			for (var continent of this.continents) {
				var randCoords = continent.randomTile(true);
				var availableNeighbours = this.neighbours(randCoords.x, randCoords.y, true).filter((neighbour) =>
					!this.continents.some((c) => 
						c.tiles.some((tile) =>
							neighbour.x == tile.x && neighbour.y == tile.y && tile.tile.altitude > -1
						)
					)
				);
				if (availableNeighbours.length === 0) {
					var availableNeighbours = this.neighbours(randCoords.x, randCoords.y, true).filter((neighbour) =>
						!this.continents.some((c) => 
							c.tiles.some((tile) =>
								neighbour.x == tile.x && neighbour.y == tile.y
							)
						)
					);	
				}
				if (availableNeighbours.length !== 0) {
					var randomNeighbour = availableNeighbours[Math.floor(Math.random() * availableNeighbours.length)];
					randomNeighbour.tile.terrain = terrains.base.field;
					if (randomNeighbour.tile.altitude > -1) {
						if (Math.random() < continent.nature.vegetation) {
							randomNeighbour.tile.altitude = 1;
							randomNeighbour.tile.terrain = terrains.base.forest;
						}
						if (Math.random() < continent.nature.roughness) {
							randomNeighbour.tile.altitude = 2;
							randomNeighbour.tile.terrain = terrains.base.mountain;
						}
						if (Math.random() < continent.nature.moisture) {
							randomNeighbour.tile.altitude = 1;
							randomNeighbour.tile.terrain = terrains.base.water;
						}
					}
					randomNeighbour.resource = undefined;
					continent.tiles.push(randomNeighbour);
				}
				noProcessedTiles++;
			}
		}
		var unassignedTiles = [];
		do {
			for (var tile of unassignedTiles) {
				var neighbourContinents = this.continents.filter((continent) => 
					continent.tiles.some((t) =>
						this.neighbours(tile.x, tile.y, true).some((neighbour) =>
							t.x == neighbour.x && t.y == neighbour.y
						)
					)
				);
				if (neighbourContinents.length !== 0) {
					neighbourContinents[Math.floor(Math.random() * neighbourContinents.length)].tiles.push(tile);
				}
			}
			var oldLength = unassignedTiles.length;
			unassignedTiles = this.tiles.reduce((result, col, x) => 
				result.concat(col.reduce((resultCol, tile, y) =>  {
					if (!this.continents.some((c) => 
						c.tiles.some((t) => 
							t.x == x && t.y == y
						)
					) && !tile.isWater) {
						resultCol.push(new TileResult(x, y, tile));
					}
					return resultCol;
				}, []))
			, []);
			if (oldLength == unassignedTiles.length && unassignedTiles.length != 0) {
				var closestTile = unassignedTiles.reduce((closest, tile) =>
					(this.distanceToNearestBuilding(closest.x, closest.y) > this.distanceToNearestBuilding(tile.x, tile.y)) ? tile : closest
				, unassignedTiles[0]);
				var radius = 1;
				var nearestContinents = [];
				while (nearestContinents.length == 0) {
					var region = this.region(closestTile.x, closestTile.y, radius++, true);
					nearestContinents = this.continents.filter((continent) =>
						continent.tiles.some((tile) =>
							region.some((t) => {
								return tile.x == t.x && tile.y == t.x;
							})
						)
					);
				}
				nearestContinents[Math.floor(Math.random() * nearestContinents.length)].tiles.push(closestTile);
			}
		} while (unassignedTiles.length != 0);
		this.addVillages();
	}
	
	getRange(x, y, range) {
		//TODO abilities
		var validMoves = [];
		var distances = Array.from(new Array(this.width), () => 
			Array.from(new Array(this.height), 
				() => Infinity
			)
		);
		debugger;
		distances[x][y]	= 0;
		var queue = new Queue();
		queue.enqueue(new TileResult(x, y, this.tiles[x][y]));
		for (var current of queue) {
			queue.enqueue(...this.neighbours(current.x, current.y, true).filter((neighbour) =>
				distances[neighbour.x][neighbour.y] > range && (distances[neighbour.x][neighbour.y] = neighbour.tile.movementCost + distances[current.x][current.y]) <= range
			));
			if (distances[current.x][current.y] > 0 && distances[current.x][current.y] <= range) validMoves.push(current);
		}
		return validMoves;
	}
	cityCount(player) {
		return this.map.reduce((count, column) => 
			count + column.reduce((columnCount, tile) => 
				columnCount + (this.tiles[x][y].hasBuilding && this.tiles[x][y].building.owner == player)
			, 0)
		, 0);
	}
}