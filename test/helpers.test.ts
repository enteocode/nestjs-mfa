import { getContextName, getCacheKey } from '../src/helpers';
import { Namespace } from '../src/namespace';
import { v5, NIL } from 'uuid';

import type { Identifier } from '../src';

describe('Helpers', () => {
    /**
     * Creates a seed based UUIDv5 under the NIL namespace
     *
     * @private
     * @param user
     */
    const createSeedBasedUuid = (user: Identifier) => {
        return v5(String(user), NIL);
    };

    it('should create a logger context name in the module namespace', () => {
        class Foo {}

        class Bar {
            public name: string = 'Baz';
        }

        expect(getContextName(Foo)).toBe('@enteocode/nestjs-mfa:Foo');
        expect(getContextName(Bar)).toBe('@enteocode/nestjs-mfa:Bar');
    });

    it('should create a cache key for secrets', () => {
        const value = getCacheKey('test', Namespace.SECRET);
        const match = `enteocode:mfa:secret:${createSeedBasedUuid('test')}`;

        expect(value).toBe(match);
    });

    it('should create a key-value cache namespace for recovery codes', () => {
        const value = getCacheKey('test', Namespace.RECOVERY_CODES);
        const match = `enteocode:mfa:recovery-codes:${createSeedBasedUuid('test')}`;

        expect(value).toBe(match);
    });
});
