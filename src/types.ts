import type { AuthenticatorOptions } from '@otplib/core';

/**
 * Entity identifier used for key-value storage (UUID, email)
 *
 * This will be used as a display in the Authenticator, but it must be unique thus
 * person name cannot be used.
 *
 * The best to use is email
 */
export type Identifier = string | number;

/**
 * 6-digit token
 */
export type Token = string;

/**
 * Recovery codes to reset the secret
 */
export type RecoveryCode = string;

/**
 * Configurable options for token generation
 */
export type TokenOptions = Partial<Pick<AuthenticatorOptions, 'digits' | 'step'>>;
