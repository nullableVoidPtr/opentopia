import {TileResult} from "./map.js"
export default class Renderer {
	constructor(context) {
		this.context = context;
	}
	renderTiles(map) {
		for (var x = 0; x < map.width; x++) for (var y = 0; y < map.height; y++) this.renderTile(new TileResult(x, y, map.tiles[x][y]), map);
	}
	renderTile(tileresult, optionalMap) {
		throw new Error("Unimplemented renderTile!");
	}
	overlayTiles(tileresults, spriteid, map) {
		for (var tileresult of tileresults) this.overlayTile(tileresult, spriteid, map);
	}
	overlayTile(tileresult, spriteid, map) {
		throw new Error("Unimplemented overlayTile!");
	}
	renderBuildings(map) {
		for (var x = 0; x < map.width; x++) for (var y = 0; y < map.height; y++) if (map.tiles[x][y].hasBuilding) this.renderBuilding(new TileResult(x, y, map.tiles[x][y]), map);
	}
	renderBuilding(tileresult, optionalMap) {
		throw new Error("Unimplemented renderBuilding!");
	}
	renderUnits(map) {
		for (var player of map.players) for (var unit of player.units) this.renderUnit(unit, player.style, map);
	}
	renderUnit(unit, style, optionalMap) {
		throw new Error("Unimplemented renderUnit!");
	}
	redrawTile(tileresult, map) {
		this.renderTile(tileresult, map);
		this.renderBuilding(tileresult, map);
		var tileUnit;
		var unitPlayer;
		if (unitPlayer = map.players.find((player) => {
			return (tileUnit = player.units.find((unit) =>
				unit.x == tileresult.x && unit.y == tileresult.y
			)) !== undefined;
		})) this.renderUnit(tileUnit, unitPlayer.style);
	}
	render(map) {
		this.renderTiles(map);
		this.renderBuildings(map);
		this.renderUnits(map);
	}
}