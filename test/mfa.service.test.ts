import { Test } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import {
    MfaService,
    EventType,
    AuthenticationNotEnabledException,
    AuthenticationFailedException,
    Format,
    TokenType
} from '../src';
import { StorageService } from '../src/storage.service';
import { OtpService } from '../src/otp.service';
import { QrCodeService } from '../src/qr/qr-code.service';
import { Namespace } from '../src/namespace';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MODULE_OPTIONS_TOKEN } from '../src/mfa.module-definition';

import { MockedStorageService } from './mocks/storage';
import { MockedLogger } from './mocks/logger';
import { MockedQrCodeService } from './mocks/qr';
import { MockedOtpService, SECRET } from './mocks/otp';
import { MockedEventEmitterService } from './mocks/event-emitter';

describe('MfaService', () => {
    let service: MfaService;
    let user = 'user@example.com';
    let token = '012345';
    let issuer = 'Enteocode';

    beforeEach(async () => {
        jest.clearAllMocks();

        const ref = await Test.createTestingModule({
            providers: [
                {
                    provide: MODULE_OPTIONS_TOKEN,
                    useValue: {
                        issuer,
                        ttl: 1
                    }
                },
                {
                    provide: StorageService,
                    useValue: MockedStorageService
                },
                {
                    provide: OtpService,
                    useValue: MockedOtpService
                },
                {
                    provide: QrCodeService,
                    useValue: MockedQrCodeService
                },
                {
                    provide: EventEmitter2,
                    useValue: MockedEventEmitterService
                },
                MfaService
            ]
        })
            .setLogger(MockedLogger)
            .compile();

        service = ref.get(MfaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('isEnabled', () => {
        it('should use storage to check for persisted secret', async () => {
            await service.isEnabled(user);

            expect(MockedStorageService.has).toHaveBeenCalledWith(user, Namespace.SECRET);
            expect(MockedStorageService.has).toHaveBeenCalledTimes(1);
        });

        it('should return true if persisted secret is found', async () => {
            MockedStorageService.has.mockResolvedValueOnce(true);

            await expect(service.isEnabled(user)).resolves.toBe(true);
        });

        it('should return false if persisted secret is not found', async () => {
            MockedStorageService.has.mockResolvedValueOnce(false);

            await expect(service.isEnabled(user)).resolves.toBe(false);
        });
    });

    describe('enable', () => {
        it('should persist a generated secret', async () => {
            await service.enable(user);

            expect(MockedStorageService.set).toHaveBeenCalledWith(user, SECRET, Namespace.SECRET);
            expect(MockedStorageService.set).toHaveBeenCalledTimes(1);
        });

        it('should return the newly generated secret if persistence succeed', async () => {
            MockedStorageService.set.mockResolvedValueOnce(SECRET);

            await expect(service.enable(user)).resolves.toBe(SECRET);
        });

        it('should return an empty string if persistence failed', async () => {
            MockedStorageService.set.mockResolvedValueOnce(false);

            await expect(service.enable(user)).resolves.toBe('');
        });

        it('should trigger an event if succeed', async () => {
            MockedStorageService.set.mockResolvedValueOnce(true);

            await service.enable(user);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.ENABLED, {
                secret: SECRET,
                user
            });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });
    });

    describe('disable', () => {
        it('should return true if user related secret was deleted', async () => {
            MockedStorageService.delete.mockResolvedValueOnce(true);

            await expect(service.disable(user)).resolves.toBe(true);
        });

        it('should return false if MFA was not enabled for the user', async () => {
            MockedStorageService.delete.mockResolvedValueOnce(false);

            await expect(service.disable(user)).resolves.toBe(false);
        });

        it('should trigger an event if succeed', async () => {
            MockedStorageService.delete.mockResolvedValueOnce(true);

            await service.disable(user);

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.DISABLED, { user });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });
    });

    describe('verify', () => {
        it('should throw exception if MFA is not enabled', async () => {
            MockedStorageService.get.mockResolvedValueOnce('');

            await expect(service.verify(user, token)).rejects.toThrow(AuthenticationNotEnabledException);
        });

        it('should throw exception if token is invalid', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);
            MockedOtpService.verify.mockReturnValueOnce(false);

            await expect(service.verify(user, token)).rejects.toThrow(AuthenticationFailedException);
        });

        it('should trigger event if MFA is not enabled', async () => {
            MockedStorageService.get.mockResolvedValueOnce('');

            await expect(service.verify(user, token)).rejects.toThrow();

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.FAILED, {
                user
            });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });

        it('should trigger event if token is invalid', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);
            MockedOtpService.verify.mockReturnValueOnce(false);

            await expect(service.verify(user, token)).rejects.toThrow();

            expect(MockedEventEmitterService.emit).toHaveBeenCalledWith(EventType.FAILED, {
                user,
                token
            });
            expect(MockedEventEmitterService.emit).toHaveBeenCalledTimes(1);
        });

        it('should not throw exception if token is valid', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);
            MockedOtpService.verify.mockReturnValueOnce(true);

            await expect(service.verify(user, token)).resolves.not.toThrow();
        });
    });

    describe('generate', () => {
        it('should throw an exception if MFA is not enabled', async () => {
            MockedStorageService.get.mockResolvedValueOnce('');

            await expect(service.generate(user, TokenType.TIMEOUT)).rejects.toThrow(AuthenticationNotEnabledException);
        });

        it('should generate a time-based token', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);
            MockedOtpService.generateToken.mockReturnValueOnce(token);

            await expect(service.generate(user, TokenType.TIMEOUT)).resolves.toBe(token);
        });

        it('should generate a KeyURI for authenticator applications (for client side QR code generation)', async () => {
            const value = 'otpauth://totp/...';

            MockedStorageService.get.mockResolvedValueOnce(SECRET);
            MockedOtpService.generateKeyUri.mockReturnValueOnce(value);

            await expect(service.generate(user, TokenType.AUTHENTICATOR)).resolves.toBe(value);
        });

        it('should generate a QR code image stream (AVIF)', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);

            await expect(service.generate(user, TokenType.AUTHENTICATOR, Format.AVIF)).resolves.toBeInstanceOf(
                StreamableFile
            );
        });

        it('should generate a QR code image stream (PNG)', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);

            await expect(service.generate(user, TokenType.AUTHENTICATOR, Format.PNG)).resolves.toBeInstanceOf(
                StreamableFile
            );
        });

        it('should generate a QR code image stream (JPG)', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);

            await expect(service.generate(user, TokenType.AUTHENTICATOR, Format.JPG)).resolves.toBeInstanceOf(
                StreamableFile
            );
        });

        it('should generate a QR code image stream (GIF)', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);

            await expect(service.generate(user, TokenType.AUTHENTICATOR, Format.GIF)).resolves.toBeInstanceOf(
                StreamableFile
            );
        });

        it('should generate a QR code image stream (WEBP)', async () => {
            MockedStorageService.get.mockResolvedValueOnce(SECRET);

            await expect(service.generate(user, TokenType.AUTHENTICATOR, Format.WEBP)).resolves.toBeInstanceOf(
                StreamableFile
            );
        });
    });
});
