import type { Identifier, RecoveryCode } from '../types';

/**
 * Should be triggered when a recovery code was consumed
 *
 * @event
 */
export class RecoveryUsedEvent {
    constructor(
        public readonly user: Identifier,
        public readonly code: RecoveryCode
    ) {}
}
