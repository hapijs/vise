import { describe, expect, it } from 'vitest';

import { Vise } from '../src/index.mjs';

describe('Vise', () => {
    const validate = function (vise, content) {
        expect(vise.length).toEqual(content.length);

        expect(vise.at(content.length)).toEqual(undefined);
        expect(vise.at(content.length + 1)).toEqual(undefined);
        expect(vise.at(content.length + 100)).toEqual(undefined);
        expect(vise.at(-1)).toEqual(undefined);

        for (let i = 0; i < content.length; ++i) {
            expect(vise.at(i)).toEqual(content.charCodeAt(i));
        }

        for (let i = content.length - 1; i >= 0; --i) {
            expect(vise.at(i)).toEqual(content.charCodeAt(i));
        }
    };

    it('combines buffers', () => {
        const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
        const vise = new Vise(data);
        validate(vise, 'abcdefghijk');
    });

    it('combines single buffer', () => {
        const data = Buffer.from('abcde');
        const vise = new Vise(data);
        expect(vise.length).toEqual(5);
        validate(vise, 'abcde');
    });

    it('allows empty input', () => {
        const vise = new Vise();
        expect(vise.length).toEqual(0);
        expect(vise.at(0)).toEqual(undefined);
    });

    it('throws on invalid input', () => {
        expect(() => {
            new Vise(123);
        }).toThrow('Chunk must be a buffer');
    });

    describe('length', () => {
        it('reflects total legnth', () => {
            const vise = new Vise([Buffer.from('abcdefghijklmn'), Buffer.from('opqrstuvwxyz')]);
            expect(vise.length).toEqual(26);
        });
    });

    describe('push()', () => {
        it('adds a string', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh')];
            const vise = new Vise(data);
            validate(vise, 'abcdefgh');

            vise.push(Buffer.from('ijk'));
            validate(vise, 'abcdefghijk');
        });

        it('adds to empty array', () => {
            const vise = new Vise();
            expect(vise.length).toEqual(0);
            expect(vise.at(0)).toEqual(undefined);
            vise.push(Buffer.from('abcde'));
            validate(vise, 'abcde');
        });
    });

    describe('shift()', () => {
        it('removes chunks', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            expect(vise.shift(2)).toEqual([Buffer.from('ab')]);
            validate(vise, 'cdefghijk');

            expect(vise.shift(2)).toEqual([Buffer.from('cd')]);
            validate(vise, 'efghijk');

            expect(vise.shift(0)).toEqual([]);
            validate(vise, 'efghijk');

            expect(vise.shift(1)).toEqual([Buffer.from('e')]);
            validate(vise, 'fghijk');

            expect(vise.shift(4)).toEqual([Buffer.from('fgh'), Buffer.from('i')]);
            validate(vise, 'jk');

            expect(vise.shift(4)).toEqual([Buffer.from('jk')]);
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
            const vise = new Vise(data);
            validate(vise, 'abcdefghijk');

            vise.shift(10);
            validate(vise, 'k');
        });
    });

    describe('chunks()', () => {
        it('returns remaining chunks', () => {
            const data = [Buffer.from('abcde'), Buffer.from('fgh'), Buffer.from('ijk')];
            const vise = new Vise(data);
            expect(vise.chunks()).toEqual(data);

            vise.shift(2);
            expect(vise.chunks()).toEqual([Buffer.from('cde'), Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(2);
            expect(vise.chunks()).toEqual([Buffer.from('e'), Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(0);
            expect(vise.chunks()).toEqual([Buffer.from('e'), Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(1);
            expect(vise.chunks()).toEqual([Buffer.from('fgh'), Buffer.from('ijk')]);

            vise.shift(4);
            expect(vise.chunks()).toEqual([Buffer.from('jk')]);

            vise.shift(4);
            expect(vise.chunks()).toEqual([]);
        });
    });

    describe('startsWith()', () => {
        it('compares single chunk (smaller)', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abcd'))).toEqual(true);
        });

        it('compares single chunk (subset)', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abce'), 0, 3)).toEqual(true);
        });

        it('compares single chunk (different)', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('asd'))).toEqual(false);
        });

        it('compares single chunk (offset)', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('bcd'), 1)).toEqual(true);
        });

        it('compares single chunk (same)', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abcdefghijkl'))).toEqual(true);
        });

        it('compares single chunk (bigger)', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('abcdefghijklx'))).toEqual(false);
        });

        it('compares multiple chunks', () => {
            const vise = new Vise([Buffer.from('a'), Buffer.from('b'), Buffer.from('cdefghijkl')]);
            expect(vise.startsWith(Buffer.from('abcd'))).toEqual(true);
        });

        it('compares multiple chunks (mismatch)', () => {
            const vise = new Vise([Buffer.from('a'), Buffer.from('b'), Buffer.from('cdefghijkl')]);
            expect(vise.startsWith(Buffer.from('acd'))).toEqual(false);
        });

        it('compares with invalid offset', () => {
            const vise = new Vise(Buffer.from('abcdefghijkl'));
            expect(vise.startsWith(Buffer.from('bcd'), -1)).toEqual(false);
        });
    });
});
