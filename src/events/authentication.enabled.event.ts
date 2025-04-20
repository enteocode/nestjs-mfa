import type { Identifier } from '../types';
import type { SecretKey } from '@otplib/core';

/**
 * Should be triggered when MFA was enabled for a user
 *
 * @event
 */
export class AuthenticationEnabledEvent {
    constructor(
        public readonly user: Identifier,
        public readonly secret: SecretKey
    ) {}
}
