import { Test } from '@nestjs/testing';
import { CipherService } from '../../src/cipher.service';
import { MODULE_OPTIONS_TOKEN } from '../../src/mfa.module-definition';

import { MockedLogger } from '../mocks/logger';

import type { MfaModuleOptionsInterface } from '../../src';

describe('CipherService', () => {
    let service: CipherService;

    beforeEach(async () => {
        const ref = await Test.createTestingModule({
            providers: [
                CipherService,
                {
                    provide: MODULE_OPTIONS_TOKEN,
                    useValue: <MfaModuleOptionsInterface>{ cipher: 'U2~@\'tq4rxzysXUZ*{UY7U' }
                }
            ]
        }).setLogger(MockedLogger).compile();

        service = ref.get(CipherService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should produce a Buffer', () => {
        const content = 'Hello World';
        const buffer = Buffer.from(content);
        const encrypted = service.encrypt(buffer);

        expect(encrypted).toBeInstanceOf(Buffer);
    });

    it('should encrypt', () => {
        const content = 'Hello World';
        const buffer = Buffer.from(content);
        const encrypted = service.encrypt(buffer);

        expect(encrypted).toBeInstanceOf(Buffer);
        expect(encrypted).not.toEqual(buffer);

        // AUTH TAG     16 bytes
        // IV           12 bytes
        // SALT         16 bytes

        expect(encrypted).toHaveLength(16 + 12 + 16 + buffer.length);
    });

    it('should decrypt', () => {
        const content = 'Hello World';
        const buffer = Buffer.from(content);
        const encrypted = service.encrypt(buffer);
        const decrypted = service.decrypt(encrypted);

        expect(decrypted).toBeInstanceOf(Buffer);
        expect(decrypted.toString()).toBe(content);
    });
});
