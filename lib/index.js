// golden response

'use strict';

const Hoek = require('@hapi/hoek');
const crypto = require('crypto');
const zlib = require('zlib');

const internals = {};

exports.Vise = class Vise {

    constructor(options = {}) {
        this.length = 0;
        this._chunks = [];
        this._offset = 0;

        this._cipher = options.cipher ? crypto.createCipheriv(options.cipher.algorithm, options.cipher.key, options.cipher.iv) : null;
        this._decipher = options.cipher ? crypto.createDecipheriv(options.cipher.algorithm, options.cipher.key, options.cipher.iv) : null;
        this._compression = options.compression || null;

        if (options.chunks) {
            options.chunks = [].concat(options.chunks);
            for (let i = 0; i < options.chunks.length; ++i) {
                this.push(options.chunks[i]);
            }
        }
    }

    push(chunk) {
        Hoek.assert(Buffer.isBuffer(chunk), 'Chunk must be a buffer');

        if (this._compression) {
            chunk = zlib.deflateSync(chunk);
        }

        if (this._cipher) {
            chunk = Buffer.concat([this._cipher.update(chunk), this._cipher.final()]);
        }

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

        const chunks = [];
        for (let i = 0; i < dropTo; ++i) {
            const chunk = this._chunks.shift();
            if (i === 0 && prevOffset) {
                chunks.push(chunk.data.slice(prevOffset));
            } else {
                chunks.push(chunk.data);
            }
        }

        if (this._offset) {
            chunks.push(item.chunk.data.slice(dropTo ? 0 : prevOffset, this._offset));
        }

        this.length = 0;
        for (let i = 0; i < this._chunks.length; ++i) {
            const chunk = this._chunks[i];
            chunk.offset = this.length;
            chunk.index = i;

            this.length += chunk.length;
        }

        this.length -= this._offset;

        let resultChunks = chunks;
        if (this._decipher) {
            resultChunks = [Buffer.concat(chunks)];
            resultChunks = [Buffer.concat([this._decipher.update(resultChunks[0]), this._decipher.final()])];
        }

        if (this._compression) {
            resultChunks = resultChunks.map(chunk => zlib.inflateSync(chunk));
        }

        return resultChunks;
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
            if (i === 0 && this._offset) {
                chunks.push(chunk.data.slice(this._offset));
            } else {
                chunks.push(chunk.data);
            }
        }

        let resultChunks = chunks;
        if (this._decipher) {
            resultChunks = [Buffer.concat(chunks)];
            resultChunks = [Buffer.concat([this._decipher.update(resultChunks[0]), this._decipher.final()])];
        }

        if (this._compression) {
            resultChunks = resultChunks.map(chunk => zlib.inflateSync(chunk));
        }

        return resultChunks;
    }

    startsWith(value, pos, length) {
        pos = pos ?? 0;
        length = length ? Math.min(value.length, length) : value.length;
        if (pos + length > this.length) {
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
