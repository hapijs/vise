/** A vise combines multiple buffers into a single, addressable virtual buffer. */
export class Vise {
    /** The combined length of all the buffers held by the vise. */
    length: number;

    /**
     * Creates a new Vise.
     *
     * @param chunks - A single buffer or an array of buffers to initialize the vise with.
     */
    constructor(chunks?: Buffer | Buffer[]);

    /**
     * Appends a buffer to the end of the vise.
     *
     * @param chunk - The buffer to add.
     */
    push(chunk: Buffer): void;

    /**
     * Removes bytes from the beginning of the vise.
     *
     * @param length - The number of bytes to remove.
     * @returns An array of the removed buffer segments.
     */
    shift(length: number): Buffer[];

    /**
     * Returns the byte value at the provided position.
     *
     * @param pos - The byte offset.
     * @returns The byte value, or `undefined` when the position is out of range.
     */
    readUInt8(pos: number): number | undefined;

    /**
     * Returns the byte value at the provided position (alias of `readUInt8()`).
     *
     * @param pos - The byte offset.
     * @returns The byte value, or `undefined` when the position is out of range.
     */
    at(pos: number): number | undefined;

    /** Returns an array of the buffer segments currently held by the vise. */
    chunks(): Buffer[];

    /**
     * Determines whether the vise begins with the provided value.
     *
     * @param value - The buffer to compare against.
     * @param pos - The byte offset to start comparing from. Defaults to `0`.
     * @param length - The number of bytes to compare. Defaults to the value length.
     * @returns `true` when the leading bytes match the value.
     */
    startsWith(value: Buffer, pos?: number, length?: number): boolean;
}
