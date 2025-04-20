import { UnauthorizedException } from '@nestjs/common';

/**
 * Should be thrown if token was provided, user has the Multi-Factor Authentication enabled,
 * but the validation was failed
 *
 * @public
 */
export class AuthenticationFailedException extends UnauthorizedException {}
