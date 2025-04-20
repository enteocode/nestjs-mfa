import { PreconditionFailedException } from '@nestjs/common';

/**
 * Should be thrown if Multi-Factor Authentication is not enabled
 * for the given user
 *
 * @public
 */
export class AuthenticationNotEnabledException extends PreconditionFailedException {}
