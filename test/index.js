'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const crypto = require('crypto');
const zlib = require('zlib');
const { Vise } = require('..');

const internals = {};

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;

const cipherOptions = {
    algorithm: 'aes-256-cbc',
    key: crypto.randomBytes(32),
    iv: crypto.randomBytes(16)
};

describe('Vise', () => {

    const validate = function (vise, content) {
        expect(vise.length).to.equal(content.length);
        expect(vise.at(content.length)).to.equal(undefined);
        expect(vise.at(content.length + 1)).to.equal(undefined);
        expect(vise.at(content.length + 100)).to.equal(undefined);
        expect(vise.at(-1)).to.equal(undefined);

        for (let i = 0; i < content.length; ++i) {
            expect(vise.at(i)).to.equal(content.charCodeAt(i));
        }

        for (let i = content.length - 1; i >= 0; --i) {
            expect(vise.at(i)).to.equal(content.charCodeAt(i));
        }
    };

    it('combines buffers', () => {
        const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
        const vise = new Vise({ chunks: data });
        validate(vise, 'abcdefghijk');
    });

    it('combines single buffer', () => {
        const data = Buffer.from('abcde');
        const vise = new Vise({ chunks: data });
        expect(vise.length).to.equal(5);
        validate(vise, 'abcde');
    });

    it('allows empty input', () => {
        const vise = new Vise();
        expect(vise.length).to.equal(0);
        expect(vise.at(0)).to.equal(undefined);
    });

    it('throws on invalid input', () => {
        expect(() => new Vise({ chunks: 123 })).to.throw('Chunk must be a buffer');
    });

    describe('length', () => {
        it('reflects total length', () => {
            const vise = new Vise({ chunks: [Buffer.from('abcdefghijklmn'), Buffer.from('opqrstuvwxyz')] });
            expect(vise.length).to.equal(26);
        });
    });

    describe('push()', () => {
        it('adds a string', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh')];
            const vise = new Vise({ chunks: data });
            validate(vise, 'abcdefgh');

            vise.push(Buffer.from('ijk'));
            validate(vise, 'abcdefghijk');
        });

        it('adds to empty array', () => {
            const vise = new Vise();
            expect(vise.length).to.equal(0);
            expect(vise.at(0)).to.equal(undefined);
            vise.push(Buffer.from('abcde'));
            validate(vise, 'abcde');
        });

        it('adds encrypted data', () => {
            const vise = new Vise({ cipher: cipherOptions });
            const data = Buffer.from('abcde');

            vise.push(data);
            const encryptedChunks = vise.chunks();
            expect(encryptedChunks.length).to.be.greaterThan(0);
        });

        it('adds compressed data', () => {
            const vise = new Vise({ compression: true });
            const data = Buffer.from('abcde');

            vise.push(data);
            const compressedChunks = vise.chunks();
            expect(compressedChunks.length).to.be.greaterThan(0);
        });
    });

    describe('shift()', () => {
        it('removes chunks', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise({ chunks: data });
            validate(vise, 'abcdefghijk');

            expect(vise.shift(2)).to.equal([Buffer.from('ab')]);
            validate(vise, 'cdefghijk');

            expect(vise.shift(2)).to.equal([Buffer.from('cd')]);
            validate(vise, 'efghijk');

            expect(vise.shift(0)).to.equal([]);
            validate(vise, 'efghijk');

            expect(vise.shift(1)).to.equal([Buffer.from('e')]);
            validate(vise, 'fghijk');

            expect(vise.shift(4)).to.equal([Buffer.from('fgh'), Buffer.from('i')]);
            validate(vise, 'jk');

            expect(vise.shift(4)).to.equal([Buffer.from('jk')]);
            validate(vise, '');
        });

        it('keeps track of chunks offset', () => {
            const vise = new Vise();

            vise.push(Buffer.from('acb123de'));
            vise.shift(3);
            vise.shift(3);
            vise.push(Buffer.from('fg12'));
            vise.push(Buffer.from('3hij1'));

            validate(vise, 'defg123hij1');
        });

        it('removes multiple chunks', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise({ chunks: data });
            validate(vise, 'abcdefghijk');

            vise.shift(10);
            validate(vise, 'k');
        });
    });

    describe('chunks()', () => {
        it('returns remaining chunks', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise({ chunks: data });
            expect(vise.chunks()).to.equal(data);

            vise.shift(2);
            expect(vise.chunks()).to.equal([Buffer.from('cde'), Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(2);
            expect(vise.chunks()).to.equal([Buffer.from('e'), Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(0);
            expect(vise.chunks()).to.equal([Buffer.from('e'), Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(1);
            expect(vise.chunks()).to.equal([Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(4);
            expect(vise.chunks()).to.equal([Buffer.from('jk')]);

            vise.shift(4);
            expect(vise.chunks()).to.equal([]);
        });

        it('returns decrypted chunks', () => {
            const vise = new Vise({ cipher: cipherOptions });
            const data = Buffer.from('abcde');

            vise.push(data);
            const encryptedChunks = vise.chunks();

            const vise2 = new Vise({ cipher: cipherOptions });
            encryptedChunks.forEach(chunk => vise2.push(chunk));
            const decryptedChunks = vise2.chunks();

            expect(Buffer.concat(decryptedChunks).toString()).to.equal(data.toString());
        });

        it('returns decompressed chunks', () => {
            const vise = new Vise({ compression: true });
            const data = Buffer.from('abcde');

            vise.push(data);
            const compressedChunks = vise.chunks();

            const vise2 = new Vise({ compression: true });
            compressedChunks.forEach(chunk => vise2.push(chunk));
            const decompressedChunks = vise2.chunks();

            expect(Buffer.concat(decompressedChunks).toString()).to.equal(data.toString());
        });
    });

    describe('startsWith()', () => {
        it('compares single chunk (smaller)', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('abcd'))).to.equal(true);
        });

        it('compares single chunk (subset)', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('abce'), 0, 3)).to.equal(true);
        });

        it('compares single chunk (different)', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('asd'))).to.equal(false);
        });

        it('compares single chunk (offset)', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('bcd'), 1)).to.equal(true);
        });

        it('compares single chunk (same)', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('abcdefghijkl'))).to.equal(true);
        });

        it('compares single chunk (bigger)', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('abcdefghijklx'))).to.equal(false);
        });

        it('compares multiple chunks', () => {
            const vise = new Vise({ chunks: [Buffer.from('a'), Buffer.from('b'), Buffer.from('cdefghijkl')] });
            expect(vise.startsWith(Buffer.from('abcd'))).to.equal(true);
        });

        it('compares multiple chunks (mismatch)', () => {
            const vise = new Vise({ chunks: [Buffer.from('a'), Buffer.from('b'), Buffer.from('cdefghijkl')] });
            expect(vise.startsWith(Buffer.from('acd'))).to.equal(false);
        });

        it('compares with invalid offset', () => {
            const vise = new Vise({ chunks: Buffer.from('abcdefghijkl') });
            expect(vise.startsWith(Buffer.from('bcd'), -1)).to.equal(false);
        });
    });
});

