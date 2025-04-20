import { Injectable } from '@nestjs/common';
import { Authenticator, Base32SecretKey, SecretKey } from '@otplib/core';
import { createRandomBytes, createDigest } from '@otplib/plugin-crypto';
import { keyEncoder, keyDecoder } from '@otplib/plugin-thirty-two';

import type { Token, TokenOptions } from './types';

@Injectable()
export class OtpService {
    /**
     * Authenticator extends TOTP, usable for both purposes
     *
     * The only difference is that Authenticator uses Base32 encoding type
     * while TOTP uses hexadecimal.
     *
     * @private
     */
    private readonly authenticator = new Authenticator({
        keyEncoder,
        keyDecoder,
        createRandomBytes,
        createDigest
    });

    /**
     * Generates an RFC 3548 / RFC 4226 compliant Base32 string compatible with
     * Google Authenticator
     *
     * @internal
     */
    public generateSecret(byteLength: number = 20): Base32SecretKey {
        // The PAM module for Google Authenticator historically generated
        // 80-bit (10 bytes) secrets, but the app and other implementations
        // support longer secrets up to and beyond 160 bits (20 bytes).
        //
        // RFC 4226 requires at least 128 bits and recommends 160 bits.

        return this.authenticator.generateSecret(byteLength);
    }

    /**
     * Generates a Time-Based One-Time Password (TOTP)
     *
     * If using an authenticator application, then the token is generated in
     * client side.
     *
     * This is useful if you want to use an email as a second factor.
     *
     * @public
     * @param secret
     * @param options
     */
    public generateToken(secret: SecretKey, options?: TokenOptions): Token {
        const epoch = Date.now();
        const clone = options ? { epoch, ...options } : { epoch };

        return this.authenticator.clone(clone).generate(secret);
    }

    /**
     * Generates a Key URI for authenticator app registration (optionally encoded as QR code)
     *
     * @public
     * @param secret
     * @param issuer
     * @param accountName
     */
    public generateKeyUri(secret: SecretKey, issuer: string, accountName: string): string {
        return this.authenticator.keyuri(accountName, issuer, secret);
    }

    /**
     * Verifies token
     *
     * @public
     * @param secret
     * @param token
     */
    public verify(secret: SecretKey, token: Token): boolean {
        return this.authenticator.check(token, secret);
    }
}
