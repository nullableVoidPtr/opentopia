import Renderer from "../renderer.js";
import * as Map from "../map.js";

var colors = {
	"terrains.base.water": "cyan",
	"terrains.base.ocean": "blue",
}

export class Sprite {
	constructor(image, x, y, w, h) {
		this.image = image;
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	}
	get drawImageParams() {
		return [this.image, this.x, this.y, this.w, this.h];
	}
}

export class Spritesheet {
	constructor(url, size, sprites) {
		this.image = new Image();
		this.imageSrc = url;
		this.size = size;
		this.sprites = sprites;
	}
	getSprite(id) {
		return (id in this.sprites) ? new Sprite(this.image, this.sprites[id].x * this.size, this.sprites[id].y * this.size, this.size, this.size) : undefined;
	}
}

export default class Topdown extends Renderer {
	constructor(context, squareSize, spritesheet) {
		super(context);
		this.context.imageSmoothingEnabled = false;
		this.squareSize = squareSize;
		this.spritesheet = spritesheet;
	}
	renderSprite(sprite, x, y, style = undefined, operation="source-over", drawOver=false) {
		var oldOperation = this.context.globalCompositeOperation;
		if (operation == "source-over") {
			this.context.globalCompositeOperation = operation;
			this.context.drawImage(...sprite.drawImageParams, x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
		} else {
			if (!drawOver) {
				this.context.globalCompositeOperation = "destination-out";
				this.context.drawImage(...sprite.drawImageParams, x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
				this.context.fillStyle = style;
				this.context.globalCompositeOperation = "destination-over";
				this.context.fillRect(x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
			}
			this.context.globalCompositeOperation = operation;
			this.context.drawImage(...sprite.drawImageParams, x * this.squareSize, y * this.squareSize, this.squareSize, this.squareSize);
		}
	this.context.globalCompositeOperation = oldOperation;
	}
	renderUnit(unit, style) {
		var sprite = this.spritesheet.getSprite(unit.id);
		if (sprite !== undefined) this.renderSprite(sprite, unit.x, unit.y, style, "multiply");
	}
	renderBuilding(tileresult) {
		if (tileresult.tile.building !== undefined) {
			var sprite = this.spritesheet.getSprite(tileresult.tile.building.type.id)
			if (tileresult.tile.building.owner !== undefined) {
				this.renderSprite(sprite, tileresult.x, tileresult.y, tileresult.tile.building.owner.style, "multiply");
			} else {
				this.renderSprite(sprite, tileresult.x, tileresult.y);
			}
		}
	}
	renderTile(tileresult, map) {
		if (colors[tileresult.tile.terrain.id]) {
			this.context.fillStyle = colors[tileresult.tile.terrain.id];
			this.context.fillRect(tileresult.x * this.squareSize, tileresult.y * this.squareSize, this.squareSize, this.squareSize);
		}
		if (map.continents) {
			for (var continent of map.continents.filter((c) => c.tiles.some((t) => t.x == tileresult.x && t.y == tileresult.y))) {
				this.context.fillStyle = continent.style;
				this.context.fillRect(tileresult.x * this.squareSize, tileresult.y * this.squareSize, this.squareSize, this.squareSize);
			}
		}
		var sprite = this.spritesheet.getSprite(tileresult.tile.terrain.id);
		if (sprite !== undefined) this.renderSprite(sprite, tileresult.x, tileresult.y, undefined, "luminosity");
	}
	overlayTile(tileresult, spriteid) {
		debugger;
		this.context.globalAlpha = 0.5;
		debugger;
		var sprite = this.spritesheet.getSprite(spriteid);
		this.renderSprite(sprite, tileresult.x, tileresult.y);
		this.context.globalAlpha = 1.0;
	}
	render(map) {
		if (this.spritesheet.image.complete && this.spritesheet.image.src != "") {
			super.render(map);
		} else {
			this.spritesheet.image.onload = super.render.bind(this, map);
			this.spritesheet.image.src = this.spritesheet.imageSrc;
		}
	}
}