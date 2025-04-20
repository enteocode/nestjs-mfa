import { Injectable } from '@nestjs/common';
import { MfaRecoveryService } from './mfa.recovery.service';
import { EventType } from './event.type';
import { OnEvent } from '@nestjs/event-emitter';
import { AuthenticationDisabledEvent } from './events/authentication.disabled.event';

@Injectable()
export class MfaEventListener {
    constructor(private readonly recovery: MfaRecoveryService) {}

    @OnEvent(EventType.DISABLED)
    public async onMfaDisabled(event: AuthenticationDisabledEvent): Promise<void> {
        // If MFA is disabled for the given user, we want to remove its recovery-codes
        // as a garbage collection

        await this.recovery.disable(event.user);
    }
}
