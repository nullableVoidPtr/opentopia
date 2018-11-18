import {TileResult, Building} from "./map.js"
import Player, {Unit, units} from "./player.js"
export default class Controller {
	constructor(map, canvas, renderer, ...rendererParameters) {
		this.map = map;
		this.canvas = canvas;
		this.context = canvas.getContext("2d")
		this.renderer = new (Function.prototype.bind.apply(renderer, [null, this.context, ...rendererParameters]));
		this.selected = undefined;
		this.selectedParent = undefined;
		this.previousX = Infinity;
		this.previousY = Infinity;
		this.sameClicks = 0;
		this.turnsLeft = 20;
		this.movesShown = [];
		this.attacksShown = [];
	}
	
	start() {
		this.currentPlayerIndex = 0;
		this.currentPlayer = this.map.players[this.currentPlayerIndex];
	}
	
	moveUnit(unit, player, destination) {
		var origin = new TileResult(unit.x, unit.y, this.map.tiles[unit.x][unit.y]);
		this.renderer.renderTile(origin, this.map);
		this.renderer.renderBuilding(origin, this.map);
		unit.x = destination.x;
		unit.y = destination.y;
		this.redrawOverlays();
		this.renderer.renderUnit(unit, player.style, this.map);
		this.sameClicks = 0;
		unit.moved = true;
	}
	
	attackUnit(unit, target) {
		unit.moved = true;
		var targetPlayer = this.map.players.find((player) =>
			player.units.includes(target)
		);
		targetPlayer.deleteUnit(target);
		this.redrawOverlays();
	}
	
	isUnitAt(x, y, ...excludedPlayers) {
		return this.map.players.some((player) =>
			!excludedPlayers.includes(player) && player.units.some((unit) =>
				unit.x == x && unit.y == y
			)
		)
	}
	
	handleClick(x, y) {
		var selectedMove = this.movesShown.find((tile) =>
			tile.x == x && tile.y == y
		);
		var selectedAttack = this.attacksShown.find((tile) =>
			tile.x == x && tile.y == y
		);
		if (selectedMove !== undefined) {
			this.moveUnit(this.selected, this.selectedParent, selectedMove);
		} else if (selectedAttack !== undefined) {
			debugger;
			var target = [].concat(...this.map.players.map((player) =>
				player.units
			)).find((unit) =>
				unit.x == selectedAttack.x && unit.y == selectedAttack.y
			);
			if (target !== undefined) {
				this.attackUnit(this.selected, target);
			}
		} else {
			this.redrawOverlays();
			this.selectedParent = this.map.players.find((player) => {
				return (this.selected = player.units.find((unit) => 
					unit.x == x && unit.y == y
				)) !== undefined;
			});
			if ((this.previousX == x && this.previousY == y) || this.selected === undefined) {
				if (this.previousX == x && this.previousY == y) {
					this.sameClicks++;
				} else {
					this.sameClicks = 0;
				}
				var tile = new TileResult(x, y, this.map.tiles[x][y]);
				if (tile.tile.hasBuilding) {
					this.selected = tile.tile.building;
					this.selectedParent = tile;
				} else {
					this.selected = tile;
				}
				if (this.sameClicks > 1) {
					this.selected = tile;
					this.selectedParent = this.map.continents.find((continent) => {
						return continent.tiles.find((t) =>
							t.x == this.selected.x && t.y == this.selected.y
						) !== undefined
					});
				} else {
					if (tile.tile.hasBuilding) {
						this.selectedParent = tile;
					} else {
						this.selectedParent = this.map.continents.find((continent) => {
							return continent.tiles.find((t) =>
								t.x == this.selected.x && t.y == this.selected.y
							) !== undefined
						});	
					}
				}
			} else {
				if (this.selectedParent == this.currentPlayer && this.selected instanceof Unit && !this.selected.moved) {
					this.attacksShown = this.map.getRange(this.selected.x, this.selected.y, this.selected.range).filter((near) =>
						this.isUnitAt(near.x, near.y, this.currentPlayer)
					);
					this.movesShown = this.map.getRange(this.selected.x, this.selected.y, this.selected.movement).filter((near) =>
						!this.isUnitAt(near.x, near.y)
					);
					this.renderer.overlayTiles(this.movesShown, "availablemove");
					this.renderer.overlayTiles(this.attacksShown, "availableattack");
				}
				this.sameClicks = 0;
			}
		}
		
		this.previousX = x;
		this.previousY = y;
	}
	
	canCapture(unit) {
		return this.selected instanceof Unit && this.selectedParent instanceof Player && !unit.moved && this.currentPlayer.units.includes(unit) && this.map.tiles[unit.x][unit.y].hasBuilding && this.map.tiles[unit.x][unit.y].building.type.id == "buildings.base.city" && this.map.tiles[unit.x][unit.y].building.owner != this.currentPlayer;
	}
	
	capture() {
		if (this.canCapture(this.selected)) {
			this.map.tiles[this.selected.x][this.selected.y].building.owner = this.selectedParent;
			this.renderer.redrawTile(new TileResult(this.selected.x, this.selected.y, this.map.tiles[this.selected.x][this.selected.y]), this.map);
		} else {
			throw Error("CAPTURE: INVALID SELECTEDS")
		}
	}
	
	canCreateUnit() {
		return this.selected instanceof Building && this.currentPlayer == this.selected.owner && !this.map.players.some((player) =>
			player.units.some((unit) =>
				this.map.tiles[unit.x][unit.y].hasBuilding && this.map.tiles[unit.x][unit.y].building == this.selected
			)
		);
	}
	
	createUnit(type = units.base.warrior) {
		if (this.canCreateUnit()) {
			this.selected.owner.addUnit(new Unit(type, this.selectedParent.x, this.selectedParent.y));
			this.selected.owner.resources -= type.cost;
			this.renderer.redrawTile(new TileResult(this.selectedParent.x, this.selectedParent.y, this.map.tiles[this.selectedParent.x][this.selectedParent.y]), this.map);
		} else {
			throw Error("CAPTURE: INVALID SELECTEDS")
		}
	}
	
	redrawOverlays() {
		for (; this.movesShown.length != 0; this.renderer.redrawTile(this.movesShown.pop(), this.map));
		for (; this.attacksShown.length != 0; this.renderer.redrawTile(this.attacksShown.pop(), this.map));
	}
	
	endTurn() {
		debugger;
		this.currentPlayer.units.map((unit) => {
			unit.moved = false;
		}); 
		var idx = ++this.currentPlayerIndex % this.map.players.length
		this.currentPlayer = this.map.players[idx];
		if (idx == 0) {
			this.turnsLeft--;
			for (player of this.map.players) {
				player.resources += c.map.cityCount(player);
			}
		}
		this.movesShown = [];
		this.attacksShown = [];
		this.previousX = Infinity;
		this.previousY = Infinity;
		this.sameClicks = 0;
		this.selected = undefined;
		this.selectedParent = undefined;
		this.renderer.render(this.map);
	}
}