import { Readable } from 'node:stream';
import { StreamableFile } from '@nestjs/common';

export const BUFFER = Buffer.from('Hello World');
export const STREAM = new StreamableFile(Readable.from(BUFFER));

export const MockedQrCodeService = {
    generate: jest.fn().mockReturnValue(STREAM)
};
