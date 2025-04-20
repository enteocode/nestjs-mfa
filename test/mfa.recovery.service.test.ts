import { Test } from '@nestjs/testing';
import { EventType, MfaRecoveryService } from '../src';
import { OtpService } from '../src/otp.service';
import { StorageService } from '../src/storage.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Namespace } from '../src/namespace';

import { MockedOtpService } from './mocks/otp';
import { MockedLogger } from './mocks/logger';
import { MockedStorageService } from './mocks/storage';
import { MockedEventEmitterService } from './mocks/event-emitter';

describe('MfaRecoveryService', () => {
    let service: MfaRecoveryService;
    let user = 'user@example.com';
    let code = 'X';
    let codes = ['A', 'B', 'C'];

    beforeEach(async () => {
        jest.clearAllMocks();

        MockedOtpService.generateSecret.mockImplementation(() => (Math.random() * 1000).toString(16));

        const ref = await Test.createTestingModule({
            providers: [
                {
                    provide: StorageService,
                    useValue: MockedStorageService
                },
                {
                    provide: OtpService,
                    useValue: MockedOtpService
                },
                {
                    provide: EventEmitter2,
                    useValue: MockedEventEmitterService
                },
                MfaRecoveryService
            ]
        })
            .setLogger(MockedLogger)
            .compile();

        service = ref.get(MfaRecoveryService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('enable', () => {
        it('should generate codes and return with them', async () => {
            MockedStorageService.has.mockResolvedValueOnce(true);
            MockedStorageService.set.mockResolvedValueOnce(true);

            const codes = await service.enable(user);

            expect(codes).toBeInstanceOf(Set);
            expect(codes).toHaveProperty('size', 10);
        });

        it('should persist codes to store', async () => {
            MockedStorageService.has.mockResolvedValueOnce(true);
            MockedStorageService.set.mockResolvedValueOnce(true);

            const codes = await service.enable(user);

            expect(MockedStorageService.set).toHaveBeenCalledWith(user, codes, Namespace.RECOVERY_CODES);
            expect(MockedStorageService.set).toHaveBeenCalledTimes(1);
        });

        it('should trigger event if recovery was enabled', async () => {
            MockedStorageService.has.mockResolvedValueOnce(true);
            MockedStorageService.set.mockResolvedValueOnce(true);

            const codes = await service.enable(user);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.RECOVERY_ENABLED, { user, codes });
        });

        it('should return null if MFA was not enabled', async () => {
            MockedStorageService.has.mockResolvedValueOnce(false);

            await expect(service.enable(user)).resolves.toBeNull();

            expect(MockedEventEmitterService.emit).not.toHaveBeenCalled();
        });

        it('should not trigger event if recovery was not enabled', async () => {
            MockedStorageService.has.mockResolvedValueOnce(false);

            await service.enable(user);

            expect(MockedEventEmitterService.emit).not.toHaveBeenCalled();
        });
    });

    describe('disable', () => {
        it('should delete the codes from the store', async () => {
            MockedStorageService.delete.mockResolvedValueOnce(true);

            await expect(service.disable(user)).resolves.toBe(true);

            expect(MockedStorageService.delete).toHaveBeenCalledWith(user, Namespace.RECOVERY_CODES);
            expect(MockedStorageService.delete).toHaveBeenCalledTimes(1);
        });

        it('should trigger an event if recovery was enabled', async () => {
            MockedStorageService.delete.mockResolvedValueOnce(true);

            await expect(service.disable(user)).resolves.toBe(true);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.RECOVERY_DISABLED, { user });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });

        it('should not trigger an event if recovery was not enabled when disable was called', async () => {
            MockedStorageService.delete.mockResolvedValueOnce(false);

            await expect(service.disable(user)).resolves.toBe(false);

            expect(MockedStorageService.delete).toHaveBeenCalledWith(user, Namespace.RECOVERY_CODES);
            expect(MockedStorageService.delete).toHaveBeenCalledTimes(1);

            expect(MockedEventEmitterService.emit).not.toHaveBeenCalled();
        });
    });

    describe('recover', () => {
        it('should return false string if recovery was not enabled', async () => {
            MockedStorageService.get.mockResolvedValueOnce(null);

            await expect(service.recover(user, '')).resolves.toBe(false);
        });

        it('should trigger an event if recovery was not enabled', async () => {
            MockedStorageService.get.mockResolvedValueOnce(null);

            await service.recover(user, code);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.RECOVERY_FAILED, { user, code });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });

        it('should return false if provided code is invalid', async () => {
            const clone = new Set(codes);

            MockedStorageService.get.mockResolvedValueOnce(clone);

            await expect(service.recover(user, code)).resolves.toBe(false);
        });

        it('should trigger an event if provided code is invalid', async () => {
            const clone = new Set(codes);

            MockedStorageService.get.mockResolvedValueOnce(clone);

            await service.recover(user, code);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.RECOVERY_FAILED, { user, code });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });

        it('should trigger an event if recovery code used', async () => {
            const clone = new Set(codes);
            const using = 'B';

            MockedStorageService.get.mockResolvedValueOnce(clone);
            MockedStorageService.set.mockResolvedValueOnce(true);

            await service.recover(user, using);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.RECOVERY_USED, { user, code: using });
        });

        it('should persist recovery codes without the consumed code if succeed', async () => {
            const clone = new Set(codes);

            MockedStorageService.get.mockResolvedValueOnce(clone);
            MockedStorageService.set.mockResolvedValue(true);

            await service.recover(user, 'B');

            expect(clone.has('B')).toBe(false);
            expect(MockedStorageService.set).toHaveBeenCalledWith(user, clone, Namespace.RECOVERY_CODES);
            expect(MockedStorageService.set).toHaveBeenCalledTimes(1);
        });

        it('should trigger an event if recovery code consumed', async () => {
            const clone = new Set(codes);
            const using = 'B';

            MockedStorageService.get.mockResolvedValueOnce(clone);
            MockedStorageService.set.mockResolvedValue(true);

            await service.recover(user, using);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.RECOVERY_USED, { user, code: using });
        });

        it('should return true if succeed', async () => {
            const clone = new Set(codes);
            const using = 'B';

            MockedStorageService.get.mockResolvedValueOnce(clone);
            MockedStorageService.set.mockResolvedValueOnce(true);

            await expect(service.recover(user, using)).resolves.toBe(true);
        });
    });
});
