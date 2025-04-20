import { Inject, Injectable, Logger } from '@nestjs/common';
import { CipherService } from './cipher.service';
import { Namespace } from './namespace';
import { SerializerService } from './serializer/serializer.service';
import { getCacheKey, getContextName } from './helpers';
import { MODULE_OPTIONS_TOKEN } from './mfa.module-definition';

import type { MfaModuleOptionsInterface } from './mfa.module.options.interface';
import type { Keyv } from 'keyv';
import type { SecretKey } from '@otplib/core';
import type { Identifier, RecoveryCode } from './types';

@Injectable()
export class StorageService {
    private readonly logger: Logger = new Logger(getContextName(StorageService));
    private readonly store: Keyv;

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN) options: MfaModuleOptionsInterface,
        private readonly cipher: CipherService,
        private readonly serializer: SerializerService
    ) {
        this.store = options.store;
        this.serializer = options.serializer || serializer;
    }

    /**
     * Checks the availability of a stored value for the user
     *
     * @protected
     * @param user
     * @param namespace
     */
    public has(user: Identifier, namespace: Namespace): Promise<boolean> {
        return this.store.has(getCacheKey(user, namespace));
    }

    /**
     * Persists the given value for the user (encrypted if cipher was provided)
     *
     * @protected
     * @param user
     * @param value
     * @param namespace
     */
    public async set(user: Identifier, value: SecretKey, namespace: Namespace.SECRET): Promise<boolean>;
    public async set(user: Identifier, value: Set<RecoveryCode>, namespace: Namespace.RECOVERY_CODES): Promise<boolean>;
    public async set(user: Identifier, value: SecretKey | Set<RecoveryCode>, namespace: Namespace): Promise<boolean> {
        const id = getCacheKey(user, namespace);
        const buffer = this.serializer.serialize(value);
        const encrypted = this.cipher.encrypt(buffer) || buffer;
        const success = await this.store.set(id, encrypted);

        if (success) {
            this.logger.debug(`Secret saved`, { id, user });
        } else {
            this.logger.error(`Cannot save secret`, { id, user });
        }
        return success;
    }

    /**
     * Retrieves the stored value for the user
     *
     * @protected
     * @param user
     * @param namespace
     */
    public async get(user: Identifier, namespace: Namespace.SECRET): Promise<SecretKey>;
    public async get(user: Identifier, namespace: Namespace.RECOVERY_CODES): Promise<Set<RecoveryCode>>;
    public async get(user: Identifier, namespace: Namespace): Promise<SecretKey | Set<RecoveryCode>> {
        const value = await this.store.get(getCacheKey(user, namespace));

        if (!value) {
            return namespace === Namespace.RECOVERY_CODES ? null : '';
        }
        return this.serializer.deserialize(this.cipher.decrypt(value) || value);
    }

    /**
     * Deletes the value for the user (if exists)
     *
     * @protected
     * @param user
     * @param namespace
     */
    public delete(user: Identifier, namespace: Namespace): Promise<boolean> {
        return this.store.delete(getCacheKey(user, namespace));
    }
}
