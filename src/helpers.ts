import { Type } from '@nestjs/common';
import { v5 } from 'uuid';
import { Namespace } from './namespace';

import type { Identifier } from './types';

/**
 * Generates a consistent context name for internal NestJS Logger instances.
 * Used to namespace logs related to this MFA module.
 *
 * @internal
 */
export const getContextName = (service: Type): string => {
    return `@enteocode/nestjs-mfa:${service.name}`;
};

/**
 * Generates a namespaced cache key for storing user-specific MFA secrets and
 * recovery codes in Keyv.
 *
 * The user identifier is first converted to a UUIDv5 to ensure the resulting key
 * is safe and compatible across different Keyv adapters (e.g., Redis, MySQL, etc.).
 *
 * UUIDv5 also helps avoid invalid characters in keys due to user input.
 *
 * @internal
 * @param user
 * @param namespace
 */
export const getCacheKey = (user: Identifier, namespace: Namespace): string => {
    const root = 'enteocode:mfa';
    const uuid = v5(String(user), '00000000-0000-0000-0000-000000000000');

    return `${root}:${namespace}:${uuid}`;
};
