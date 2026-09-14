import { gunzipSync } from "node:zlib";

type NbtValue =
  | null
  | number
  | string
  | NbtValue[]
  | { [key: string]: NbtValue };
class Cursor {
  private offset = 0;
  private readonly bytes: Uint8Array;
  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }
  private read(length: number) {
    const end = this.offset + length;
    if (end > this.bytes.length) throw new Error("Unexpected end of NBT data");
    const value = this.bytes.slice(this.offset, end);
    this.offset = end;
    return value;
  }
  byte() {
    return this.read(1)[0];
  }
  int8() {
    return new DataView(this.read(1).buffer).getInt8(0);
  }
  int16() {
    return new DataView(this.read(2).buffer).getInt16(0);
  }
  int32() {
    return new DataView(this.read(4).buffer).getInt32(0);
  }
  float32() {
    return new DataView(this.read(4).buffer).getFloat32(0);
  }
  float64() {
    return new DataView(this.read(8).buffer).getFloat64(0);
  }
  int64() {
    return Number(new DataView(this.read(8).buffer).getBigInt64(0));
  }
  string() {
    const length = new DataView(this.read(2).buffer).getUint16(0);
    return new TextDecoder().decode(this.read(length));
  }
}
const readPayload = (cursor: Cursor, type: number): NbtValue => {
  switch (type) {
    case 1:
      return cursor.int8();
    case 2:
      return cursor.int16();
    case 3:
      return cursor.int32();
    case 4:
      return cursor.int64();
    case 5:
      return cursor.float32();
    case 6:
      return cursor.float64();
    case 7: {
      const length = cursor.int32();
      return Array.from({ length }, () => cursor.int8());
    }
    case 8:
      return cursor.string();
    case 9: {
      const itemType = cursor.byte();
      const length = cursor.int32();
      return Array.from({ length }, () => readPayload(cursor, itemType));
    }
    case 10: {
      const result: { [key: string]: NbtValue } = {};
      while (true) {
        const itemType = cursor.byte();
        if (itemType === 0) return result;
        result[cursor.string()] = readPayload(cursor, itemType);
      }
    }
    case 11: {
      const length = cursor.int32();
      return Array.from({ length }, () => cursor.int32());
    }
    case 12: {
      const length = cursor.int32();
      return Array.from({ length }, () => cursor.int64());
    }
    default:
      throw new Error("Unsupported NBT tag type: " + type);
  }
};
export const parseNbt = (input: Buffer) => {
  const source = new Uint8Array(input);
  const bytes =
    source[0] === 0x1f && source[1] === 0x8b
      ? new Uint8Array(gunzipSync(source))
      : source;
  const cursor = new Cursor(bytes);
  if (cursor.byte() !== 10) throw new Error("NBT root must be a compound");
  cursor.string();
  return readPayload(cursor, 10) as { [key: string]: NbtValue };
};
export type { NbtValue };
