import type { Identifier, Token } from '../types';
import type { ExecutionContext } from '@nestjs/common';

/**
 * Context
 *
 * To support various contexts:
 *
 * For your own strategy, implement this interface and annotate with @MfaContextResolver()
 * decorator.
 *
 * - HTTP
 * - RPC
 * - WebSocket
 * - Custom protocols (GraphQL, Kafka, etc.)
 */
export interface MfaCredentialsExtractorInterface {
    /**
     * Should decide if the extractor is supporting the given environment
     *
     * @param context
     */
    supports(context: ExecutionContext): boolean;

    /**
     * Should return the unique identifier for the user used in key-value
     * storage
     *
     * @example user@example.com
     */
    getUserIdentifier(context: ExecutionContext): Identifier;

    /**
     * Should return with the (6-digit) token from the authenticator app or
     * other source
     *
     * @example 826496
     */
    getToken(context: ExecutionContext): Token;
}
