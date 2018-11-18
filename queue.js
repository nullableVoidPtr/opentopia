export default class Queue {
	constructor() {
		this._queue = [];
		this.offset = 0;
	}
	get length() {return this._queue.length - this.offset}
	enqueue(...elements) {this._queue.push(...elements)}
	dequeue() {
		if (this.length == 0) return undefined;
		var element = this._queue[this.offset++];
		if (this.offset * 2 >= this._queue.length) {
			this._queue = this._queue.splice(this.offset);
			this.offset = 0;
		}
		return element;
	}
	next() {
		return Object.assign({
			done: this.length == 0
		}, this.length == 0 ? {} : {
			value: this.dequeue()
		})
	}
	[Symbol.iterator]() {return this}
}