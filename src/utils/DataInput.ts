/* eslint-disable no-mixed-operators */
import { TextDecoder } from "util";

export default class DataInput {
    private pos = 0;
    private readonly buf: Uint8Array;
    private readonly view: DataView;

    public constructor(bytes: Uint8Array | string) {
        if (typeof bytes === "string") bytes = new Uint8Array(Buffer.from(bytes, "base64"));
        this.buf = bytes;
        this.view = new DataView(bytes.buffer);
    }

    public readBoolean(): boolean {
        return this.readByte() !== 0;
    }

    public readByte(): number {
        return this.buf[this._advance(1)];
    }

    public readUnsignedShort(): number {
        return this.view.getUint16(this._advance(2), false);
    }

    public readInt(): number {
        return this.view.getInt32(this._advance(4), false);
    }

    public readLong(): bigint {
        const msb = this.view.getInt32(this._advance(4), false);
        const lsb = this.view.getUint32(this._advance(4), false);
        return BigInt(msb) << 32n | BigInt(lsb);
    }

    public readUTF(): string {
        const len = this.readUnsignedShort();
        const start = this._advance(len);
        return new TextDecoder().decode(this.buf.slice(start, start + len));
    }

    private _advance(bytes: number): number {
        if (this.pos + bytes > this.buf.length) {
            throw new Error(`EOF: Tried to read ${bytes} bytes at offset ${
                this.pos}, but buffer size is only ${this.buf.length}`);
        }
        const p = this.pos;
        this.pos += bytes;
        return p;
    }
}
