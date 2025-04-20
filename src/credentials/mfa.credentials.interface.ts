import type { Identifier, Token } from '../types';

export interface MfaCredentialsInterface {
    /**
     * Identifier of the user
     */
    user: Identifier;

    /**
     * Generated token (one-time password)
     */
    token: Token;
}
