import { Injectable } from '@nestjs/common';
import { serialize, deserialize } from 'node:v8';

import type { SerializerInterface } from './serializer.interface';

@Injectable()
export class SerializerService implements SerializerInterface {
    /**
     * Serializes the value into a Buffer
     *
     * @public
     * @param value
     */
    public serialize<T = unknown>(value: T): Buffer {
        return serialize(value);
    }

    /**
     * Deserializes the value from Buffer to unknown
     *
     * @public
     * @param value
     */
    public deserialize<T = unknown>(value: Buffer): T {
        return deserialize(value);
    }
}
