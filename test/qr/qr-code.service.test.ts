import { Test } from '@nestjs/testing';
import { StreamableFile } from '@nestjs/common';
import { Format } from '../../src';
import { QrCodeService } from '../../src/qr/qr-code.service';

import { MockedLogger } from '../mocks/logger';

/**
 * Reads a small fraction of the readable stream to detect filetype
 * by magic numbers
 *
 * @private
 * @param stream
 * @param readBytes
 */
const collect = (stream: StreamableFile, readBytes: number = 20): Promise<Buffer> => {
    const reader = stream.getStream();

    return new Promise<Buffer>((resolve) => {
        reader.on('readable', () => {
            resolve(reader.read(readBytes));
            reader.destroy();
        });
    });
};

describe('QrCodeService', () => {
    let service: QrCodeService;
    let uri = 'otpauth://totp/enteocode:adam.szekely?secret=DQHD66LSLIAC2IK5';

    beforeEach(async () => {
        const ref = await Test.createTestingModule({ providers: [QrCodeService] })
            .setLogger(MockedLogger)
            .compile();

        service = ref.get(QrCodeService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should produce a StreamableFile stream', async () => {
        await expect(service.generate(uri, Format.PNG)).resolves.toBeInstanceOf(StreamableFile);
    });

    // Checking output file-types (with magic numbers)

    it('should generate AVIF', async () => {
        const stream = await service.generate(uri, Format.AVIF);
        const buffer = await collect(stream, 20);

        expect(stream).toBeInstanceOf(StreamableFile);
        expect(stream.getHeaders().type).toBe('image/avif');
        expect(buffer.length).toBe(20);

        expect(buffer.subarray(0x4, 0xc)).toEqual(Buffer.from([0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66]));
    });

    it('should generate PNG', async () => {
        const stream = await service.generate(uri, Format.PNG);
        const buffer = await collect(stream, 20);

        expect(stream).toBeInstanceOf(StreamableFile);
        expect(stream.getHeaders().type).toBe('image/png');
        expect(buffer.length).toBe(20);

        expect(buffer.subarray(0x0, 0x8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    });

    it('should generate JPG', async () => {
        const stream = await service.generate(uri, Format.JPG);
        const buffer = await collect(stream, 20);

        expect(stream).toBeInstanceOf(StreamableFile);
        expect(stream.getHeaders().type).toBe('image/jpeg');
        expect(buffer.length).toBe(20);
        expect(buffer.subarray(0x0, 0x3)).toEqual(Buffer.from([0xff, 0xd8, 0xff]));

        expect(Buffer.from([0xe0, 0xe1, 0xdb]).includes(buffer.subarray(0x3, 0x4))).toBe(true);
    });

    it('should generate GIF', async () => {
        const stream = await service.generate(uri, Format.GIF);
        const buffer = await collect(stream, 20);

        expect(stream).toBeInstanceOf(StreamableFile);
        expect(stream.getHeaders().type).toBe('image/gif');
        expect(buffer.length).toBe(20);

        expect(buffer.subarray(0x0, 0x4)).toEqual(Buffer.from([0x47, 0x49, 0x46, 0x38]));
    });

    it('should generate WEBP', async () => {
        const stream = await service.generate(uri, Format.WEBP);
        const buffer = await collect(stream, 20);

        expect(stream).toBeInstanceOf(StreamableFile);
        expect(stream.getHeaders().type).toBe('image/webp');
        expect(buffer.length).toBe(20);

        expect(buffer.subarray(0x0, 0x4)).toEqual(Buffer.from([0x52, 0x49, 0x46, 0x46]));
        expect(buffer.subarray(0x8, 0xc)).toEqual(Buffer.from([0x57, 0x45, 0x42, 0x50]));
    });
});
