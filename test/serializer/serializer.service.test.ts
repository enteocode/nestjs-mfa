import { Test } from '@nestjs/testing';
import { SerializerService } from '../../src/serializer/serializer.service';
import { randomUUID } from 'node:crypto';

import { MockedLogger } from '../mocks/logger';

describe('SerializerService', () => {
    let service: SerializerService;

    beforeEach(async () => {
        const ref = await Test.createTestingModule({ providers: [SerializerService] }).setLogger(MockedLogger).compile();

        service = ref.get(SerializerService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should produce a Buffer as output', () => {
        expect(service.serialize('Hello World')).toBeInstanceOf(Buffer);
    });

    it('should work with string', () => {
        const content = 'Hello World';
        const encoded = service.serialize(content);
        const decoded = service.deserialize(encoded);

        expect(encoded).toBeInstanceOf(Buffer);
        expect(decoded).toStrictEqual(content);
    });

    it('should work with number', () => {
        const content = 13.4567;
        const encoded = service.serialize(content);
        const decoded = service.deserialize(encoded);

        expect(encoded).toBeInstanceOf(Buffer);
        expect(decoded).toStrictEqual(content);
    });


    it('should work with Buffer', () => {
        const content = 'Hello World';
        const buffer = Buffer.from(content);
        const encoded = service.serialize<Buffer>(buffer);
        const decoded = service.deserialize<Buffer>(encoded);

        expect(encoded).toBeInstanceOf(Buffer);
        expect(decoded).toStrictEqual(buffer);
        expect(decoded.toString()).toStrictEqual(content);
    });

    it('should work with Date', () => {
        const content = new Date();
        const encoded = service.serialize(content);
        const decoded = service.deserialize(encoded);

        expect(encoded).toBeInstanceOf(Buffer);
        expect(decoded).toEqual(content);
    });

    it('should work with complex object', () => {
        const content = {
            uuid: randomUUID(),
            date: new Date(),
            list: [1, 5, 3],
            meta: {
                name: 'user@example.com'
            }
        };
        const encoded = service.serialize(content);
        const decoded = service.deserialize(encoded);

        expect(encoded).toBeInstanceOf(Buffer);
        expect(decoded).toEqual(content);
    });
});
