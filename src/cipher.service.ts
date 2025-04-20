import { Inject, Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, DecipherGCM, randomBytes, scryptSync } from 'node:crypto';
import { getContextName } from './helpers';
import { MODULE_OPTIONS_TOKEN } from './mfa.module-definition';

import type { MfaModuleOptionsInterface } from './mfa.module.options.interface';
import type { BinaryLike } from 'node:crypto';

@Injectable()
export class CipherService {
    private readonly logger: Logger = new Logger(getContextName(CipherService));
    private readonly secret: BinaryLike;

    constructor(@Inject(MODULE_OPTIONS_TOKEN) { cipher }: MfaModuleOptionsInterface) {
        this.secret = cipher;
    }

    /**
     * Encrypts the value with AES-256-GCM
     *
     * This algorithm is authenticated, used in TLS 1.3, SSH and servers for
     * its bandwidth (~500-800 MB/s) and protection against padding oracle
     * attacks
     *
     * @internal
     * @param buffer
     */
    public encrypt(buffer: Buffer): Buffer {
        if (!this.secret) {
            return buffer;
        }
        const salt = randomBytes(16);
        const iv = randomBytes(12);
        const key = scryptSync(this.secret, salt, 32);
        const cipher = createCipheriv('aes-256-gcm', key, iv);
        const encoded = Buffer.concat([
            cipher.update(buffer),
            cipher.final()
        ]);

        // Authentication tag has a fixed 16 byte length

        const tag: Buffer = cipher.getAuthTag();

        return Buffer.concat([iv, salt, tag, encoded]);
    }

    /**
     * Decrypts the stored value
     *
     * @internal
     * @param buffer
     */
    public decrypt(buffer: Buffer): Buffer {
        if (!this.secret) {
            return buffer;
        }
        const iv = buffer.subarray(0, 12);
        const salt = buffer.subarray(12, 12 + 16);
        const tag = buffer.subarray(12 + 16, 12 + 16 + 16);
        const key = scryptSync(this.secret, salt, 32);
        const decipher: DecipherGCM = createDecipheriv('aes-256-gcm', key, iv);

        decipher.setAuthTag(tag);

        try {
            return Buffer.concat([decipher.update(buffer.subarray(12 + 16 + 16)), decipher.final()]);
        } catch (e) {
            this.logger.error(`Couldn't decrypt secret`, { message: e.message });
        }
    }
}
