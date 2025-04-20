import type { Keyv } from 'keyv';
import type { SerializerInterface } from './serializer/serializer.interface';

import type { BinaryLike } from 'node:crypto';

export interface MfaModuleOptionsInterface {
    /**
     * Application name (displayed in authenticator)
     */
    issuer: string;

    /**
     * Key-value store to persist generated secrets for users (default: memory)
     */
    store: Keyv;

    /**
     * Time-to-live for time-based tokens (default: 30)
     */
    ttl?: number;

    /**
     * Optional service to serialize/deserialize values to store (default: V8)
     */
    serializer?: SerializerInterface;

    /**
     * Optional secret to encrypt generated user secrets on the store for an
     * additional layer of protection for the case of data-leaks.
     *
     * SHA1:    20 bytes (default)
     * SHA256:  32 bytes
     * SHA512:  64 bytes
     */
    cipher?: BinaryLike;
}
