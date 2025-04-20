import { ContextType, SetMetadata } from '@nestjs/common';
import { MFA_CONTEXT_ALL, MFA_CREDENTIALS_EXTRACTOR } from './mfa.credentials.constants';

/**
 * Decorator to annotate context resolvers
 *
 * @public
 */
export const MfaCredentialsExtractor = <T extends string = ContextType>(type?: T) => {
    return SetMetadata(MFA_CREDENTIALS_EXTRACTOR, type || MFA_CONTEXT_ALL);
};
