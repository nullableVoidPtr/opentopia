import Renderer from "../renderer.js";
import * as Map from "../Map.js"

var colors = {
	"terrains.base.water": "cyan",
	"terrains.base.ocean": "blue",
}

var overlays = {
	"terrains.base.forest": "green",
	"terrains.base.mountain": "gray",
	"buildings.base.city": "black",
}

export default class Topdown extends Renderer {
	constructor(canvas, map, squareSize) {
		super(canvas, map);
		this.squareSize = squareSize;
		this.context.textAlign = "center";
		this.context.font = "30px Arial";
	}
	renderTile(x, y) {
		var tile = this.map.tiles[x][y];
		if (colors[tile.terrain.id]) {
			this.context.fillStyle = colors[tile.terrain.id];
			this.context.fillRect(x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
		}
		if (this.map.continents) {
			for (var continent of this.map.continents) {
				if (continent.tiles.some((t) =>
					t.x == x && t.y == y 
				)) {
					this.context.fillStyle = continent.style;
					this.context.fillRect(x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
					break;
				}
			}
		}
		if (overlays[tile.terrain.id]) {
			this.context.fillStyle = overlays[tile.terrain.id];
			this.context.fillRect(x * this.squareSize + (this.squareSize / 4),  y * this.squareSize + (this.squareSize / 4),  this.squareSize / 2,  this.squareSize / 2);
		}
		if (tile.hasBuilding) {
			this.context.fillStyle = overlays[tile.building.type.id];
			this.context.fillRect(x * this.squareSize + (this.squareSize / 4),  y * this.squareSize + (this.squareSize / 4),  this.squareSize / 2,  this.squareSize / 2);
		}
	}
	
}