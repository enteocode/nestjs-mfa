import type { Identifier, RecoveryCode } from '../types';

/**
 * Should be triggered when recovery was enabled for a user
 *
 * @public
 * @event
 */
export class RecoveryEnabledEvent {
    constructor(
        public readonly user: Identifier,
        public readonly codes: Set<RecoveryCode>
    ) {}
}
