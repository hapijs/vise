'use strict';

const Code = require('code');
const Lab = require('lab');
const Vise = require('..');


const internals = {};


const lab = exports.lab = Lab.script();
const describe = lab.describe;
const it = lab.it;
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

    it('combines buffers', (done) => {

        const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
        const vise = new Vise(data);
        validate(vise, 'abcdefghijk');
        done();
    });

    it('combines single buffer', (done) => {

        const data = Buffer.from('abcde');
        const vise = new Vise(data);
        expect(vise.length).to.equal(5);
        validate(vise, 'abcde');
        done();
    });

    it('allows empty input', (done) => {

        const vise = new Vise();
        expect(vise.length).to.equal(0);
        expect(vise.at(0)).to.equal(undefined);
        done();
    });

    it('throws on invalid input', (done) => {

        expect(() => {

            new Vise(123);
        }).to.throw('Chunk must be a buffer');

        done();
    });

    describe('length', () => {

        it('reflects total legnth', (done) => {

            const vise = new Vise([Buffer.from('abcdefghijklmn'), Buffer.from('opqrstuvwxyz')]);
            expect(vise.length).to.equal(26);
            done();
        });
    });

    describe('push()', () => {

        it('adds a string', (done) => {

            const data = [Buffer.from('abcde'), Buffer.from('fgh')];
            const vise = new Vise(data);
            validate(vise, 'abcdefgh');

            vise.push(Buffer.from('ijk'));
            validate(vise, 'abcdefghijk');
            done();
        });

        it('adds to empty array', (done) => {

            const vise = new Vise();
            expect(vise.length).to.equal(0);
            expect(vise.at(0)).to.equal(undefined);
            vise.push(Buffer.from('abcde'));
            validate(vise, 'abcde');
            done();
        });
    });

    describe('shift()', (done) => {

        it('removes chunks', (done) => {

            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise(data);
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

            done();
        });

        it('keeps track of chunks offset', (done) => {

            const vise = new Vise();

            vise.push(Buffer.from('acb123de'));
            vise.shift(3);
            vise.shift(3);
            vise.push(Buffer.from('fg12'));
            vise.push(Buffer.from('3hij1'));

            validate(vise, 'defg123hij1');
            done();
        });

        it('removes multiple chunks', (done) => {

            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            vise.shift(10);
            validate(vise, 'k');

            done();
        });
    });

    describe('chunks()', (done) => {

        it('returns remaining chunks', (done) => {

            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise(data);
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

            done();
        });
    });

    describe('startsWith()', () => {

        it('compares single chunk (smaller)', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abcd'))).to.equal(true);
            done();
        });

        it('compares single chunk (subset)', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abce'), 0, 3)).to.equal(true);
            done();
        });

        it('compares single chunk (different)', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('asd'))).to.equal(false);
            done();
        });

        it('compares single chunk (offset)', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('bcd'), 1)).to.equal(true);
            done();
        });

        it('compares single chunk (same)', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abcdefghijkl'))).to.equal(true);
            done();
        });

        it('compares single chunk (bigger)', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abcdefghijklx'))).to.equal(false);
            done();
        });

        it('compares multiple chunks', (done) => {

            const vise = new Vise([Buffer.from('a'), Buffer.from('b'), Buffer.from('cdefghijkl')]);
            expect(vise.startsWith(Buffer.from('abcd'))).to.equal(true);
            done();
        });

        it('compares multiple chunks (mismatch)', (done) => {

            const vise = new Vise([Buffer.from('a'), Buffer.from('b'), Buffer.from('cdefghijkl')]);
            expect(vise.startsWith(Buffer.from('acd'))).to.equal(false);
            done();
        });

        it('compares with invalid offset', (done) => {

            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('bcd'), -1)).to.equal(false);
            done();
        });
    });
});
