import { Test } from '@nestjs/testing';
import { NestApplicationContext } from '@nestjs/core';
import { Keyv } from 'keyv';
import { MfaModule } from '../src';
import { EventEmitterModule } from '@nestjs/event-emitter';

describe('MfaModule', () => {
    it('should be defined', async () => {
        const module = Test.createTestingModule({
            imports: [
                EventEmitterModule.forRoot(),
                MfaModule.forRoot({ issuer: 'enteocode.mfa', store: new Keyv() })
            ]
        });

        await expect(module.compile()).resolves.toBeInstanceOf(NestApplicationContext);
    });
});
