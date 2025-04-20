import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CipherService } from './cipher.service';
import { StorageService } from './storage.service';
import { QrCodeService } from './qr/qr-code.service';
import { SerializerService } from './serializer/serializer.service';
import { MfaService } from './mfa.service';
import { OtpService } from './otp.service';
import { MfaEventListener } from './mfa.event-listener';
import { MfaCredentialsExtractorManager } from './credentials/mfa.credentials.extractor.manager';
import { MfaCredentialsPipe } from './credentials/mfa.credentials.pipe';
import { MfaRecoveryService } from './mfa.recovery.service';
import { ASYNC_OPTIONS_TYPE, ConfigurableModuleClass, OPTIONS_TYPE } from './mfa.module-definition';

@Module({
    imports: [EventEmitterModule, DiscoveryModule],
    exports: [MfaService, MfaRecoveryService],
    providers: [
        SerializerService,
        CipherService,
        StorageService,
        QrCodeService,
        OtpService,
        MfaService,
        MfaRecoveryService,
        MfaEventListener,
        MfaCredentialsExtractorManager,
        MfaCredentialsPipe
    ]
})
export class MfaModule extends ConfigurableModuleClass {
    /**
     * Synchronous registration by direct value allocation
     *
     * @param options
     */
    public static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
        return super.forRoot(options);
    }

    /**
     * Asynchronous registration with option of dynamic value setting through
     * factory
     *
     * @param options
     */
    public static forRootAsync(options: typeof ASYNC_OPTIONS_TYPE): DynamicModule {
        return super.forRootAsync(options);
    }
}
