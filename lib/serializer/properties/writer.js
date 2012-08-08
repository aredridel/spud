'use strict';

var os = require('os'),
	util = require('util'),
	Stream = require('stream'),
	AbstractWriter = require('../abstractWriter');

function PropertyWriter() {
	PropertyWriter.super_.call(this);
}

/*global exports:true*/
exports = module.exports = PropertyWriter;
util.inherits(PropertyWriter, AbstractWriter);
/*global exports:false*/

var proto = PropertyWriter.prototype;

proto._doCreateReadStream = function(data) {
	return new ReadStream(data);
};




var ReadStream = function ReadStream(data) {
	Stream.call(this);

	this._data = data;
	this._processed = false;
	this._buffer = [];
	this._remaining = 0;
	this._paused = true;
};

util.inherits(ReadStream, Stream);

ReadStream.prototype.pause = function () {
	this._paused = true;
};

ReadStream.prototype.drain = function () {
	this.resume();
};

ReadStream.prototype.resume = function () {
	this._paused = false;

	// Start writing to stream
	if (this._data && !this._processed) {
		this._read(null, this._data);
		this._remaining = this._buffer.length;
		this._processed = true;
	}

	// Work through buffer to process
	if (this._buffer.length) {

		this._buffer.splice(0).forEach(function (entry) {
			process.nextTick(function () {
				if (this._paused) {
					this._buffer.push(entry);
				} else {
					this.emit('data', entry);
					this._remaining -= 1;
					if (!this._remaining) {
						this.emit('end');
						this.emit('close');
						this._data = null;
					}
				}
			}.bind(this));
		}.bind(this));

	} else {

		// All done, no buffered entries
		this.emit('end');
		this.emit('close');
		this._data = null;
	}

};

ReadStream.prototype.destroy = function () {
	this._buffer = null;
	this._data = null;
	this.emit('close');
};

ReadStream.prototype._read = function (namespace, data) {

	// TODO: Some more work in this direction to make it
	// super fast, if necessary.
	//process.nextTick(function () {

		switch (typeof data) {
			case 'object':
				if (Array.isArray(data)) {
					data.forEach(function (item) {
						this._read(namespace, item);
					}.bind(this));
				} else {
					Object.keys(data).forEach(function (key) {
						var name = namespace ? namespace + '.' + key : key;
						this._read(name, data[key]);
					}.bind(this));
				}
				break;

			case 'number':
				this._read(namespace, Number.isFinite(data) ? String(data) : '');
				break;

			case 'boolean':
				this._read(namespace, String(data));
				break;

			case 'null':
				this._read(namespace, String(data));
				break;

			case 'string':
				var value = [namespace, '=', data, os.EOL].join('');
				if (this._paused) {
					this._buffer.push(value);
				} else {
					this.emit('data', value);
				}
				break;

			default:
				console.warn('Unserializable value:', data);
		}

	//}.bind(this));

};