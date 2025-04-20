import { Test } from '@nestjs/testing';
import { Controller, ExecutionContext, Get, Injectable } from '@nestjs/common';
import { MfaCredentials, MfaService, MfaCredentialsExtractor } from '../src/';
import { MfaCredentialsPipe } from '../src/credentials/mfa.credentials.pipe';
import { MfaCredentialsExtractorManager } from '../src/credentials/mfa.credentials.extractor.manager';
import { DiscoveryModule } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

import { MockedLogger } from './mocks/logger';

import type { FastifyRequest } from 'fastify';
import type { Identifier, Token, MfaCredentialsExtractorInterface, MfaCredentialsInterface } from '../src/';

describe('MfaCredentials', () => {
    let manager: MfaCredentialsExtractorManager;
    let app: NestFastifyApplication;
    let verify = jest.fn();

    @MfaCredentialsExtractor('http')
    @Injectable()
    class TestHttpCredentialsExtractor implements MfaCredentialsExtractorInterface {
        supports(context: ExecutionContext): boolean {
            return Boolean(context.switchToHttp().getRequest<FastifyRequest>().headers['x-mfa']);
        }

        getUserIdentifier(context: ExecutionContext): Identifier {
            return URL.parse(context.switchToHttp().getRequest<FastifyRequest>().headers['x-mfa'] as string).username;
        }

        getToken(context: ExecutionContext): Token {
            return URL.parse(context.switchToHttp().getRequest<FastifyRequest>().headers['x-mfa'] as string).password;
        }
    }

    @MfaCredentialsExtractor()
    @Injectable()
    class NullCredentialsExtractor implements MfaCredentialsExtractorInterface {
        supports(): boolean {
            return false;
        }

        getUserIdentifier(): Identifier {
            return '';
        }

        getToken(): Token {
            return '';
        }
    }

    @Controller()
    class TestController {
        @Get('test')
        public test(@MfaCredentials() context: MfaCredentialsInterface) {
            return context;
        }
    }

    beforeEach(async () => {
        jest.clearAllMocks();

        const ref = await Test.createTestingModule({
            controllers: [TestController],
            imports: [DiscoveryModule],
            providers: [
                {
                    provide: MfaService,
                    useValue: {
                        verify
                    }
                },
                MfaCredentialsPipe,
                MfaCredentialsExtractorManager,
                NullCredentialsExtractor,
                TestHttpCredentialsExtractor
            ]
        })
            .setLogger(MockedLogger)
            .compile();

        manager = ref.get(MfaCredentialsExtractorManager);

        // Simulate lifecycle events

        manager.onModuleInit();

        // Simulate HTTP server

        app = ref.createNestApplication(new FastifyAdapter());

        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
        await app.close();
    });

    it('should have the manager be defined', () => {
        expect(manager).toBeDefined();
    });

    it('should discover decorated extractors', () => {
        const web = Array.from(manager.get('http'));
        const all = Array.from(manager.get('all'));

        expect(web).toHaveLength(2);
        expect(web[0]).toBeInstanceOf(TestHttpCredentialsExtractor);
        expect(web[1]).toBeInstanceOf(NullCredentialsExtractor);

        expect(all).toHaveLength(1);
        expect(all[0]).toBeInstanceOf(NullCredentialsExtractor);
    });

    it('should inject resolved credentials for the parameter decorator', async () => {
        const response = await app.inject({
            method: 'GET',
            url: '/test',
            headers: {
                'x-mfa': 'otp://user:012345@authenticator'
            }
        });

        expect(response.statusCode).toBe(200);
        expect(JSON.parse(response.body)).toEqual({ user: 'user', token: '012345' });
    });
});
