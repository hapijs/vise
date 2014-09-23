// Load modules

var Hoek = require('hoek');


// Declare internals

var internals = {};


exports = module.exports = internals.Vise = function (chunks) {

    this.length = 0;
    this._chunks = [];
    this._offset = 0;
    this._last = null;          // Keep track of last looked to speed up consecutive searches

    if (chunks) {
        chunks = [].concat(chunks);
        for (var i = 0, il = chunks.length; i < il; ++i) {
            this.push(chunks[i]);
        }
    }
};


internals.Vise.prototype.push = function (chunk) {

    Hoek.assert(typeof chunk === 'string' || Buffer.isBuffer(chunk), 'Chunk must be string or buffer');

    this._chunks.push({
        data: chunk,
        isBuffer: typeof chunk !== 'string',
        length: chunk.length,
        offset: this.length,
        index: this._chunks.length
    });

    this.length += chunk.length;
};


internals.Vise.prototype.shift = function (length) {

    if (!length) {
        return;
    }

    var item = this._chunkAt(length);

    var dropTo = this._chunks.length;
    this._last = null;
    this._offset = 0;

    if (item) {
        dropTo = item.chunk.index;
        this._offset = item.offset;
    }

    // Drop lower chunks

    for (var i = 0; i < dropTo; ++i) {
        this._chunks.shift();
    }

    // Recalculate existing chunks

    this.length = 0;
    for (var j = 0, jl = this._chunks.length; j < jl; ++j) {
        var chunk = this._chunks[j];
        chunk.offset = this.length,
        chunk.index = j;

        this.length += chunk.length;
    }

    this.length -= this._offset;
};


internals.Vise.prototype.charCodeAt = function (pos) {

    var item = this._chunkAt(pos);
    return (item ? (item.chunk.isBuffer ? item.chunk.data[item.offset] : item.chunk.data.charCodeAt(item.offset)) : undefined);
};


internals.Vise.prototype._chunkAt = function (pos) {

    if (pos < 0) {
        return null;
    }

    pos = pos + this._offset;

    var start = 0;
    var offset = (this._last ? pos - this._last.offset : -1);
    if (offset >= 0) {
        start = this._last.index + (offset < this._last.length ? 0 : 1);
    }

    for (var i = start, il = this._chunks.length; i < il; ++i) {
        var chunk = this._chunks[i];
        offset = pos - chunk.offset;
        if (offset < chunk.length) {
            this._last = chunk;
            return { chunk: chunk, offset: offset };
        }
    }

    return null;
};
