import type { Identifier, Token } from '../types';

/**
 * Should be triggered when a token failed verification
 *
 * @event
 */
export class AuthenticationFailedEvent {
    constructor(
        public readonly user: Identifier,
        public readonly token?: Token
    ) {}
}
