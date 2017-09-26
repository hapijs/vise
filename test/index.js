'use strict';

// Load modules

const Code = require('code');
const Lab = require('lab');
const Vise = require('..');


// Declare internals

const internals = {};


// Test shortcuts

const { describe, it } = exports.lab = Lab.script();
const expect = Code.expect;


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

    it('combines buffers', async () => {

        const data = [new Buffer('abcde'), new Buffer('fgh'), new Buffer('ijk')];
        const vise = new Vise(data);
        validate(vise, 'abcdefghijk');
    });

    it('combines single buffer', async () => {

        const data = new Buffer('abcde');
        const vise = new Vise(data);
        expect(vise.length).to.equal(5);
        validate(vise, 'abcde');
    });

    it('allows empty input', async () => {

        const vise = new Vise();
        expect(vise.length).to.equal(0);
        expect(vise.at(0)).to.equal(undefined);
    });

    it('throws on invalid input', async () => {

        expect(() => {

            new Vise(123);
        }).to.throw('Chunk must be a buffer');
    });

    describe('length', () => {

        it('reflects total legnth', async () => {

            const vise = new Vise([new Buffer('abcdefghijklmn'), new Buffer('opqrstuvwxyz')]);
            expect(vise.length).to.equal(26);
        });
    });

    describe('push()', () => {

        it('adds a string', async () => {

            const data = [new Buffer('abcde'), new Buffer('fgh')];
            const vise = new Vise(data);
            validate(vise, 'abcdefgh');

            vise.push(new Buffer('ijk'));
            validate(vise, 'abcdefghijk');
        });

        it('adds to empty array', async () => {

            const vise = new Vise();
            expect(vise.length).to.equal(0);
            expect(vise.at(0)).to.equal(undefined);
            vise.push(new Buffer('abcde'));
            validate(vise, 'abcde');
        });
    });

    describe('shift()', async () => {

        it('removes chunks', async () => {

            const data = [new Buffer('abcde'), new Buffer('fgh'), new Buffer('ijk')];
            const vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            expect(vise.shift(2)).to.equal([new Buffer('ab')]);
            validate(vise, 'cdefghijk');

            expect(vise.shift(2)).to.equal([new Buffer('cd')]);
            validate(vise, 'efghijk');

            expect(vise.shift(0)).to.equal([]);
            validate(vise, 'efghijk');

            expect(vise.shift(1)).to.equal([new Buffer('e')]);
            validate(vise, 'fghijk');

            expect(vise.shift(4)).to.equal([new Buffer('fgh'), new Buffer('i')]);
            validate(vise, 'jk');

            expect(vise.shift(4)).to.equal([new Buffer('jk')]);
            validate(vise, '');
        });

        it('keeps track of chunks offset', async () => {

            const vise = new Vise();

            vise.push(new Buffer('acb123de'));
            vise.shift(3);
            vise.shift(3);
            vise.push(new Buffer('fg12'));
            vise.push(new Buffer('3hij1'));

            validate(vise, 'defg123hij1');
        });

        it('removes multiple chunks', async () => {

            const data = [new Buffer('abcde'), new Buffer('fgh'), new Buffer('ijk')];
            const vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            vise.shift(10);
            validate(vise, 'k');
        });
    });

    describe('chunks()', async () => {

        it('returns remaining chunks', async () => {

            const data = [new Buffer('abcde'), new Buffer('fgh'), new Buffer('ijk')];
            const vise = new Vise(data);
            expect(vise.chunks()).to.equal(data);

            vise.shift(2);
            expect(vise.chunks()).to.equal([new Buffer('cde'), new Buffer('fgh'), new Buffer('ijk')]);

            vise.shift(2);
            expect(vise.chunks()).to.equal([new Buffer('e'), new Buffer('fgh'), new Buffer('ijk')]);

            vise.shift(0);
            expect(vise.chunks()).to.equal([new Buffer('e'), new Buffer('fgh'), new Buffer('ijk')]);

            vise.shift(1);
            expect(vise.chunks()).to.equal([new Buffer('fgh'), new Buffer('ijk')]);

            vise.shift(4);
            expect(vise.chunks()).to.equal([new Buffer('jk')]);

            vise.shift(4);
            expect(vise.chunks()).to.equal([]);
        });
    });

    describe('startsWith()', () => {

        it('compares single chunk (smaller)', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('abcd'))).to.equal(true);
        });

        it('compares single chunk (subset)', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('abce'), 0, 3)).to.equal(true);
        });

        it('compares single chunk (different)', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('asd'))).to.equal(false);
        });

        it('compares single chunk (offset)', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('bcd'), 1)).to.equal(true);
        });

        it('compares single chunk (same)', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('abcdefghijkl'))).to.equal(true);
        });

        it('compares single chunk (bigger)', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('abcdefghijklx'))).to.equal(false);
        });

        it('compares multiple chunks', async () => {

            const vise = new Vise([new Buffer('a'), new Buffer('b'), new Buffer('cdefghijkl')]);
            expect(vise.startsWith(new Buffer('abcd'))).to.equal(true);
        });

        it('compares multiple chunks (mismatch)', async () => {

            const vise = new Vise([new Buffer('a'), new Buffer('b'), new Buffer('cdefghijkl')]);
            expect(vise.startsWith(new Buffer('acd'))).to.equal(false);
        });

        it('compares with invalid offset', async () => {

            const vise = new Vise(new Buffer('abcdefghijkl'));
            expect(vise.startsWith(new Buffer('bcd'), -1)).to.equal(false);
        });
    });
});
