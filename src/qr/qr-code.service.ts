import { Injectable, StreamableFile } from '@nestjs/common';
import { toFileStream } from 'qrcode';
import { Format } from './qr-code.format';
import { InvalidFormatException } from '../exceptions/invalid-format.exception';

import sharp from 'sharp';

import type { Readable } from 'node:stream';

@Injectable()
export class QrCodeService {
    /**
     * Generates a QR code for the given Key URI in the given image format
     *
     * @internal
     * @param uri
     * @param format
     */
    public async generate(uri: string, format: Format): Promise<StreamableFile> {
        const encoder = sharp().removeAlpha().grayscale(true);

        await toFileStream(encoder, uri);

        if (format === Format.AVIF) {
            return this.getStreamableFile(encoder.avif(), format);
        }
        if (format === Format.PNG) {
            return this.getStreamableFile(encoder.png({ colors: 2 }), format);
        }
        if (format === Format.JPG) {
            return this.getStreamableFile(encoder.jpeg({ mozjpeg: true, progressive: true }), format);
        }
        if (format === Format.WEBP) {
            return this.getStreamableFile(encoder.webp({ lossless: true }), format);
        }
        if (format === Format.GIF) {
            return this.getStreamableFile(encoder.gif({ colors: 2, reuse: true }), format);
        }
        throw new InvalidFormatException('Format to generate QR Code is not supported', { cause: format });
    }

    /**
     * Returns a type annotated readable stream, ready to be served with a
     * NestJS controller
     *
     * @private
     * @param stream
     * @param format
     */
    private getStreamableFile(stream: Readable, format: Format): StreamableFile {
        return new StreamableFile(stream, { type: format });
    }
}
