import { describe, expectTypeOf, it } from 'vitest';

import { Vise } from '../src/index.js';

describe('typings', () => {
    describe('constructor', () => {
        it('accepts nothing, a buffer or an array of buffers', () => {
            expectTypeOf(new Vise()).toEqualTypeOf<Vise>();
            expectTypeOf(new Vise(Buffer.from('a'))).toEqualTypeOf<Vise>();
            expectTypeOf(new Vise([Buffer.from('a'), Buffer.from('b')])).toEqualTypeOf<Vise>();
        });

        it('invalid calls rejected', () => {
            try {
                // @ts-expect-error chunks must be a buffer or an array of buffers
                new Vise('abc');
            } catch {}
        });
    });

    describe('length', () => {
        it('is a number', () => {
            expectTypeOf(new Vise().length).toBeNumber();
        });
    });

    describe('push()', () => {
        it('returns nothing', () => {
            expectTypeOf(new Vise().push(Buffer.from('a'))).toBeVoid();
        });

        it('invalid calls rejected', () => {
            try {
                // @ts-expect-error chunk must be a buffer
                new Vise().push('a');
            } catch {}
        });
    });

    describe('shift()', () => {
        it('returns buffers', () => {
            expectTypeOf(new Vise(Buffer.from('ab')).shift(1)).toEqualTypeOf<Buffer[]>();
        });

        it('invalid calls rejected', () => {
            // @ts-expect-error length must be a number
            new Vise().shift('1');
        });
    });

    describe('readUInt8()', () => {
        it('returns a byte or undefined', () => {
            expectTypeOf(new Vise(Buffer.from('a')).readUInt8(0)).toEqualTypeOf<number | undefined>();
        });

        it('invalid calls rejected', () => {
            // @ts-expect-error pos must be a number
            new Vise().readUInt8('0');
        });
    });

    describe('at()', () => {
        it('returns a byte or undefined', () => {
            expectTypeOf(new Vise(Buffer.from('a')).at(0)).toEqualTypeOf<number | undefined>();
        });

        it('invalid calls rejected', () => {
            // @ts-expect-error pos must be a number
            new Vise().at('0');
        });
    });

    describe('chunks()', () => {
        it('returns buffers', () => {
            expectTypeOf(new Vise(Buffer.from('a')).chunks()).toEqualTypeOf<Buffer[]>();
        });
    });

    describe('startsWith()', () => {
        it('returns a boolean', () => {
            const vise = new Vise(Buffer.from('abc'));

            expectTypeOf(vise.startsWith(Buffer.from('a'))).toBeBoolean();
            expectTypeOf(vise.startsWith(Buffer.from('b'), 1)).toBeBoolean();
            expectTypeOf(vise.startsWith(Buffer.from('bc'), 1, 1)).toBeBoolean();
        });

        it('invalid calls rejected', () => {
            // @ts-expect-error value must be a buffer
            new Vise().startsWith(1);
        });
    });
});
