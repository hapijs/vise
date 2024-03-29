'use strict';

const Hoek = require('@hapi/hoek');


const internals = {};


exports.Vise = class Vise {

    constructor(chunks) {

        this.length = 0;
        this._chunks = [];
        this._offset = 0;

        if (chunks) {
            chunks = [].concat(chunks);
            for (let i = 0; i < chunks.length; ++i) {
                this.push(chunks[i]);
            }
        }
    }

    push(chunk) {

        Hoek.assert(Buffer.isBuffer(chunk), 'Chunk must be a buffer');

        const item = {
            data: chunk,
            length: chunk.length,
            offset: this.length + this._offset,
            index: this._chunks.length
        };

        this._chunks.push(item);
        this.length += chunk.length;
    }

    shift(length) {

        if (!length) {
            return [];
        }

        const prevOffset = this._offset;
        const item = this.#chunkAt(length);

        let dropTo = this._chunks.length;
        this._offset = 0;

        if (item) {
            dropTo = item.chunk.index;
            this._offset = item.offset;
        }

        // Drop lower chunks

        const chunks = [];
        for (let i = 0; i < dropTo; ++i) {
            const chunk = this._chunks.shift();
            if (i === 0 &&
                prevOffset) {

                chunks.push(chunk.data.slice(prevOffset));
            }
            else {
                chunks.push(chunk.data);
            }
        }

        if (this._offset) {
            chunks.push(item.chunk.data.slice(dropTo ? 0 : prevOffset, this._offset));
        }

        // Recalculate existing chunks

        this.length = 0;
        for (let i = 0; i < this._chunks.length; ++i) {
            const chunk = this._chunks[i];
            chunk.offset = this.length,
            chunk.index = i;

            this.length += chunk.length;
        }

        this.length -= this._offset;

        return chunks;
    }

    readUInt8(pos) {

        const item = this.#chunkAt(pos);
        return item ? item.chunk.data[item.offset] : undefined;
    }

    at(pos) {

        return this.readUInt8(pos);
    }

    #chunkAt(pos) {

        if (pos < 0) {
            return null;
        }

        pos = pos + this._offset;

        for (let i = 0; i < this._chunks.length; ++i) {
            const chunk = this._chunks[i];
            const offset = pos - chunk.offset;
            if (offset < chunk.length) {
                return { chunk, offset };
            }
        }

        return null;
    }

    chunks() {

        const chunks = [];

        for (let i = 0; i < this._chunks.length; ++i) {
            const chunk = this._chunks[i];
            if (i === 0 &&
                this._offset) {

                chunks.push(chunk.data.slice(this._offset));
            }
            else {
                chunks.push(chunk.data);
            }
        }

        return chunks;
    }

    startsWith(value, pos, length) {

        pos = pos ?? 0;

        length = length ? Math.min(value.length, length) : value.length;
        if (pos + length > this.length) {                                   // Not enough length to fit value
            return false;
        }

        const start = this.#chunkAt(pos);
        if (!start) {
            return false;
        }

        let j = start.chunk.index;
        for (let i = 0; j < this._chunks.length && i < length; ++j) {
            const chunk = this._chunks[j];

            let k = (j === start.chunk.index ? start.offset : 0);
            for (; k < chunk.length && i < length; ++k, ++i) {
                if (chunk.data[k] !== value[i]) {
                    return false;
                }
            }
        }

        return true;
    }
};
