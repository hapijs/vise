import { describe, expect, it } from 'vitest';

import * as Vise from '../src/index.mjs';

describe('import()', () => {
    it('exposes all classes as named imports', () => {
        expect(Object.keys(Vise)).toEqual(['Vise']);
    });
});
