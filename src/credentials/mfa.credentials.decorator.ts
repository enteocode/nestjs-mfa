import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MfaCredentialsPipe } from './mfa.credentials.pipe';

import type { MfaCredentialsDecoratorOptionsInterface } from './mfa.credentials.decorator.options.interface';

/**
 * Contextual variables for MfaCredentialsPipe
 *
 * @internal
 */
export type MfaCredentialsContext = {
    context: ExecutionContext;
    options: MfaCredentialsDecoratorOptionsInterface;
};

/**
 * Parameter decorator to retrieve the resolved context object
 *
 * @public
 */
export const MfaCredentials = (options?: MfaCredentialsDecoratorOptionsInterface) => {
    return createParamDecorator(
        (data: unknown, context: ExecutionContext): MfaCredentialsContext => ({
            context,
            options
        })
    )(MfaCredentialsPipe);
};
