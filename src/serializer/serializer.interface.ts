export interface SerializerInterface {
    /**
     * Serializes any value into a Buffer
     *
     * @public
     * @param value
     */
    serialize<T = unknown>(value: T): Buffer;

    /**
     * Deserializes a serialized Buffer into any value
     *
     * @public
     * @param value
     */
    deserialize<T = unknown>(value: Buffer): T;
}
