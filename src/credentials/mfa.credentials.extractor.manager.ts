import { ExecutionContext, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MfaCredentialsExtractorInterface } from './mfa.credentials.extractor.interface';
import { DiscoveryService, ModuleRef, Reflector } from '@nestjs/core';
import { getContextName } from '../helpers';
import { MFA_CREDENTIALS_EXTRACTOR } from './mfa.credentials.constants';

import type { MfaCredentialsExtractorType as Type } from './mfa.credentials.extractor.type';

@Injectable()
export class MfaCredentialsExtractorManager implements OnModuleInit {
    private readonly logger: Logger = new Logger(getContextName(MfaCredentialsExtractorManager));
    private readonly memory: Map<Type, Set<MfaCredentialsExtractorInterface>> = new Map();

    constructor(
        private readonly discovery: DiscoveryService,
        private readonly ref: ModuleRef,
        private readonly reflector: Reflector
    ) {}

    /**
     * Lifecycle event to gather decorated extractors
     *
     * @internal
     */
    public onModuleInit(): void {
        const providers = this.discovery.getProviders();

        for (const { metatype } of providers) {
            if (!metatype) {
                continue;
            }
            const metadata = this.reflector.get(MFA_CREDENTIALS_EXTRACTOR, metatype);

            if (!metadata) {
                continue;
            }
            const instance = this.ref.get(metatype, { strict: false });

            if (!instance) {
                continue;
            }
            this.logger.debug('MFA context resolver discovered', {
                meta: metatype.name,
                type: metadata
            });
            this.add(metadata, instance);
        }
    }

    /**
     * Adds an extractor instance to the grouped stack
     *
     * @protected
     * @param type
     * @param resolver
     */
    public add(type: Type, resolver: MfaCredentialsExtractorInterface): void {
        const { memory } = this;

        if (!memory.has(type)) {
            memory.set(type, new Set());
        }
        memory.get(type).add(resolver);
    }

    /**
     * Returns an iterator for the given execution context type
     *
     * @protected
     * @param type
     */
    public *get(type: Type): IterableIterator<MfaCredentialsExtractorInterface> | null {
        const { memory } = this;

        if (memory.has(type)) {
            yield* memory.get(type);
        }
        if (type !== 'all' && memory.has('all')) {
            yield* memory.get('all');
        }
    }

    /**
     * Resolves an extractor supporting the actual execution context
     *
     * @protected
     * @param context
     */
    public resolve(context: ExecutionContext): MfaCredentialsExtractorInterface {
        const type = context.getType();

        for (const extractor of this.get(type)) {
            if (!extractor.supports(context)) {
                continue;
            }
            return extractor;
        }
        return null;
    }
}
