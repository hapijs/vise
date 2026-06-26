import { describe, expectTypeOf, it } from 'vitest';

import { Vise } from '../lib/index.js';

describe('typings', () => {
    it('Vise surface compiles', () => {
        const vise = new Vise(Buffer.from('abc'));

        expectTypeOf(vise.length).toBeNumber();
        expectTypeOf(vise.push(Buffer.from('d'))).toBeVoid();
        expectTypeOf(vise.shift(1)).toEqualTypeOf<Buffer[]>();
        expectTypeOf(vise.readUInt8(0)).toEqualTypeOf<number | undefined>();
        expectTypeOf(vise.at(0)).toEqualTypeOf<number | undefined>();
        expectTypeOf(vise.chunks()).toEqualTypeOf<Buffer[]>();
        expectTypeOf(vise.startsWith(Buffer.from('a'))).toBeBoolean();
        expectTypeOf(vise.startsWith(Buffer.from('a'), 0, 1)).toBeBoolean();

        new Vise([Buffer.from('a'), Buffer.from('b')]);
        new Vise();
    });

    it('invalid calls rejected', () => {
        // The @ts-expect-error directives are the assertion; the calls still run, so
        // wrap them — a non-buffer chunk throws at runtime (the type errors are the test).
        try {
            // @ts-expect-error chunks must be a buffer or array of buffers
            new Vise('abc');
            // @ts-expect-error push requires a buffer
            new Vise().push('x');
        } catch {}
    });
});
