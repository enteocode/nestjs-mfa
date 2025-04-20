import { Injectable, Logger } from '@nestjs/common';
import { Namespace } from './namespace';
import { StorageService } from './storage.service';
import { EventEmitter2 as EventEmitter } from '@nestjs/event-emitter';
import { RecoveryEnabledEvent } from './events/recovery.enabled.event';
import { OtpService } from './otp.service';
import { RecoveryFailedEvent } from './events/recovery.failed.event';
import { RecoveryUsedEvent } from './events/recovery.used.event';
import { RecoveryDisabledEvent } from './events/recovery.disabled.event';
import { EventType } from './event.type';
import { getContextName } from './helpers';

import type { Identifier, RecoveryCode } from './types';

@Injectable()
export class MfaRecoveryService {
    private readonly logger: Logger = new Logger(getContextName(MfaRecoveryService));

    constructor(
        private readonly storage: StorageService,
        private readonly otp: OtpService,
        private readonly emitter: EventEmitter
    ) {}

    /**
     * Persists the generated recovery codes
     *
     * @public
     * @param user
     * @param count
     * @param byteLength
     */
    public async enable(user: Identifier, count: number = 10, byteLength = 10): Promise<Set<RecoveryCode> | null> {
        const isMfaEnabled = await this.storage.has(user, Namespace.SECRET);

        if (!isMfaEnabled) {
            return null;
        }
        const codes: Set<RecoveryCode> = new Set();

        while (codes.size < count) {
            codes.add(this.otp.generateSecret(byteLength));
        }
        const success = await this.storage.set(user, codes, Namespace.RECOVERY_CODES);

        if (success) {
            this.logger.log('MFA recovery enabled for user', { user, count });
            this.emitter.emit(EventType.RECOVERY_ENABLED, new RecoveryEnabledEvent(user, codes));

            return codes;
        } else {
            this.logger.error('Cannot enable MFA recovery for user', { user });
        }
        return null;
    }

    /**
     * Disables recovery
     *
     * @public
     * @param user
     */
    public async disable(user: Identifier): Promise<boolean> {
        const success = await this.storage.delete(user, Namespace.RECOVERY_CODES);

        if (success) {
            this.logger.log('MFA recovery disabled', { user });
            this.emitter.emit(EventType.RECOVERY_DISABLED, new RecoveryDisabledEvent(user));
        }
        return success;
    }

    /**
     * Recovers the lost account by creating a new secret
     *
     * @public
     * @param user
     * @param code
     */
    public async recover(user: Identifier, code: RecoveryCode): Promise<boolean> {
        const codes: Set<RecoveryCode> = await this.storage.get(user, Namespace.RECOVERY_CODES);

        if (!codes) {
            this.logger.error('MFA recovery failed', { user, reason: 'No recovery codes persisted' });
            this.emitter.emit(EventType.RECOVERY_FAILED, new RecoveryFailedEvent(user, code));

            return false;
        }
        if (!codes.delete(code)) {
            this.logger.error('MFA recovery failed', { user, reason: 'Invalid code' });
            this.emitter.emit(EventType.RECOVERY_FAILED, new RecoveryFailedEvent(user, code));

            return false;
        }
        const success = await this.storage.set(user, codes, Namespace.RECOVERY_CODES);

        if (!success) {
            return false;
        }
        this.logger.log('MFA recovery success', { user, code });
        this.emitter.emit(EventType.RECOVERY_USED, new RecoveryUsedEvent(user, code));

        return true;
    }
}
