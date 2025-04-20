import type { Identifier } from '../types';

/**
 * Should be triggered when MFA was disabled for a user
 *
 * @event
 */
export class AuthenticationDisabledEvent {
    constructor(public readonly user: Identifier) {}
}
