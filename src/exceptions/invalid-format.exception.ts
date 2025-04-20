import { UnsupportedMediaTypeException } from '@nestjs/common';

/**
 * Should be thrown if QR code generation was called with a not-supported
 * format
 *
 * @public
 */
export class InvalidFormatException extends UnsupportedMediaTypeException {}
