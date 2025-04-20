import { Test } from '@nestjs/testing';
import { serialize, deserialize } from 'node:v8';
import { StorageService } from '../../src/storage.service';
import { Keyv } from 'keyv';
import { Namespace } from '../../src/namespace';
import { SerializerService } from '../../src/serializer/serializer.service';
import { CipherService } from '../../src/cipher.service';
import { MODULE_OPTIONS_TOKEN } from '../../src/mfa.module-definition';

import { MockedLogger } from '../mocks/logger';

import type { MfaModuleOptionsInterface } from '../../src';

describe('StorageService', () => {
    let service: StorageService;
    let store: Keyv;
    let user = 'user@example.com';
    let secret = 'DQHD66LSLIAC2IK5';
    let codes = new Set(['ABCDE-01234', 'FGHIJ-56789']);

    beforeEach(async () => {
        store = new Keyv({ namespace: '' });

        const ref = await Test.createTestingModule({
            providers: [
                {
                    provide: MODULE_OPTIONS_TOKEN,
                    useValue: <MfaModuleOptionsInterface>{ store }
                },
                {
                    provide: SerializerService,
                    useValue: {
                        serialize<T = unknown>(value: T): Buffer {
                            return serialize(value);
                        },

                        deserialize<T = unknown>(value: Buffer): T {
                            return deserialize(value);
                        }
                    }
                },
                {
                    provide: CipherService,
                    useValue: {
                        encrypt(buffer: Buffer): Buffer {
                            return buffer;
                        },

                        decrypt(stored: Buffer): Buffer {
                            return stored;
                        }
                    }
                },
                StorageService
            ]
        }).setLogger(MockedLogger).compile();

        service = ref.get(StorageService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should set a secret', async () => {
        expect(store.store.size).toBe(0);

        await expect(service.set(user, secret, Namespace.SECRET)).resolves.toBe(true);
        expect(store.store.size).toBe(1);
    });

    it('should set recovery codes', async () => {
        expect(store.store.size).toBe(0);

        await expect(service.set(user, codes, Namespace.RECOVERY_CODES)).resolves.toBe(true);
        expect(store.store.size).toBe(1);
    });

    it('should get a secret', async () => {
        await service.set(user, secret, Namespace.SECRET);

        await expect(service.get(user, Namespace.SECRET)).resolves.toBe(secret);
    });

    it('should get recovery codes', async () => {
        await service.set(user, codes, Namespace.RECOVERY_CODES);
        const retrieved = await service.get(user, Namespace.RECOVERY_CODES);

        expect(retrieved.size).toBe(codes.size);
        expect(Array.from(retrieved.values())).toEqual(Array.from(codes.values()));
    });

    it('should check for secret', async () => {
        await expect(service.has(user, Namespace.SECRET)).resolves.toBe(false);
        await expect(service.set(user, secret, Namespace.SECRET)).resolves.toBe(true);
        await expect(service.has(user, Namespace.SECRET)).resolves.toBe(true);
    });

    it('should check for recovery codes', async () => {
        await expect(service.has(user, Namespace.RECOVERY_CODES)).resolves.toBe(false);
        await expect(service.set(user, codes, Namespace.RECOVERY_CODES)).resolves.toBe(true);
        await expect(service.has(user, Namespace.RECOVERY_CODES)).resolves.toBe(true);
    });

    it('should delete a secret', async () => {
        await service.set(user, secret, Namespace.SECRET);

        await expect(service.delete(user, Namespace.SECRET)).resolves.toBe(true);
        await expect(service.delete(user, Namespace.SECRET)).resolves.toBe(false);
    });

    it('should delete a recovery codes', async () => {
        await service.set(user, codes, Namespace.RECOVERY_CODES);

        await expect(service.delete(user, Namespace.RECOVERY_CODES)).resolves.toBe(true);
        await expect(service.delete(user, Namespace.RECOVERY_CODES)).resolves.toBe(false);
    });
});
