import type { Identifier, RecoveryCode } from '../types';

/**
 * Should be triggered when recovery was failed
 *
 * @event
 */
export class RecoveryFailedEvent {
    constructor(
        public readonly user: Identifier,
        public readonly code: RecoveryCode
    ) {}
}
