import { Inject, Injectable, Logger, StreamableFile } from '@nestjs/common';
import { OtpService } from './otp.service';
import { StorageService } from './storage.service';
import { Identifier, Token, TokenOptions } from './types';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { AuthenticationNotEnabledException } from './exceptions/authentication-not-enabled.exception';
import { AuthenticationEnabledEvent } from './events/authentication.enabled.event';
import { AuthenticationDisabledEvent } from './events/authentication.disabled.event';
import { AuthenticationFailedEvent } from './events/authentication.failed.event';
import { Namespace } from './namespace';
import { TokenType } from './token.type';
import { EventType } from './event.type';
import { Format } from './qr/qr-code.format';
import { AuthenticationFailedException } from './exceptions/authentication.failed.exception';
import { QrCodeService } from './qr/qr-code.service';
import { getContextName } from './helpers';
import { MODULE_OPTIONS_TOKEN } from './mfa.module-definition';

import type { MfaModuleOptionsInterface } from './mfa.module.options.interface';
import type { SecretKey } from '@otplib/core';

@Injectable()
export class MfaService {
    private readonly logger: Logger = new Logger(getContextName(MfaService));

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN) private readonly options: MfaModuleOptionsInterface,
        private readonly otp: OtpService,
        private readonly storage: StorageService,
        private readonly qr: QrCodeService,
        private readonly emitter: EventEmitter
    ) {}

    /**
     * Checks if Multi-Factor Authentication is enabled
     *
     * @public
     * @param user
     */
    public async isEnabled(user: Identifier): Promise<boolean> {
        return await this.storage.has(user, Namespace.SECRET);
    }

    /**
     * Enable Multi-Factor Authentication
     *
     * @public
     * @param user
     */
    public async enable(user: Identifier): Promise<SecretKey> {
        const secret = this.otp.generateSecret();
        const success = await this.storage.set(user, secret, Namespace.SECRET);

        if (success) {
            this.logger.log('MFA is enabled for user', { user });
            this.emitter.emit(EventType.ENABLED, new AuthenticationEnabledEvent(user, secret));

            return secret;
        } else {
            this.logger.error('Cannot enable MFA for user', { user });
        }
        return '';
    }

    /**
     * Disable Multi-Factor Authentication  (if it was enabled)
     *
     * @public
     * @param user
     */
    public async disable(user: Identifier): Promise<boolean> {
        const success = await this.storage.delete(user, Namespace.SECRET);

        if (success) {
            this.logger.log('MFA is disabled for user', { user });
            this.emitter.emit(EventType.DISABLED, new AuthenticationDisabledEvent(user));
        }
        return success;
    }

    /**
     * Check the 6-digit token
     *
     * @public
     * @param user
     * @param token
     */
    public async verify(user: Identifier, token: Token): Promise<void> {
        const secret = await this.storage.get(user, Namespace.SECRET);

        if (!secret) {
            this.emitter.emit(EventType.FAILED, new AuthenticationFailedEvent(user));
            throw new AuthenticationNotEnabledException({ user }, { cause: 'MFA is not enabled' });
        }
        if (!this.otp.verify(secret, token)) {
            this.emitter.emit(EventType.FAILED, new AuthenticationFailedEvent(user, token));
            throw new AuthenticationFailedException({ user }, { cause: 'MFA token invalid' });
        }
    }

    /**
     * Generates a 6-digit token for timeout-based authentication (useful for email-based validation)
     *
     * @public
     * @param user
     * @param type
     * @param options
     */
    public async generate(user: Identifier, type: TokenType.TIMEOUT, options?: TokenOptions): Promise<Token>;

    /**
     * Generates a KeyURI for Authenticator (if QR code is generated at client-side)
     *
     * @public
     * @param user
     * @param type
     * @see https://github.com/google/google-authenticator/wiki/Key-Uri-Format
     */
    public async generate(user: Identifier, type: TokenType.AUTHENTICATOR): Promise<string>;

    /**
     * Generates a QR code (stream to minimize memory usage)
     *
     * @public
     * @param user
     * @param type
     * @param format
     */
    public async generate(user: Identifier, type: TokenType.AUTHENTICATOR, format: Format): Promise<StreamableFile>;

    /**
     * Implementation (overload)
     *
     * @public
     * @param user
     * @param type
     * @param options
     */
    public async generate(
        user: Identifier,
        type: TokenType,
        options?: Format | TokenOptions
    ): Promise<Token | StreamableFile> {
        const secret = await this.storage.get(user, Namespace.SECRET);

        if (!secret) {
            throw new AuthenticationNotEnabledException({ user }, { cause: 'MFA is not enabled' });
        }
        const isOptionsObject = typeof options === 'object';

        if (type === TokenType.TIMEOUT) {
            const base = { step: this.options.ttl || 30 };
            const next = isOptionsObject ? options : {};

            return this.otp.generateToken(secret, { ...base, ...next });
        }
        const uri = this.otp.generateKeyUri(secret, this.options.issuer, String(user));

        if (!options || isOptionsObject) {
            return uri;
        }
        return await this.qr.generate(uri, options);
    }
}
