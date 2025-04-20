import type { Identifier } from '../types';

/**
 * Should be triggered when recovery was disabled for a user
 *
 * @event
 */
export class RecoveryDisabledEvent {
    constructor(public readonly user: Identifier) {}
}
