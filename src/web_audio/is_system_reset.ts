const eq = (d: Uint8Array, at: number, bytes: number[]) => bytes.every((b, i) => d[at + i] === b);

export default function is_system_reset(d: Uint8Array): boolean {
    // GM System On / Off、GM2 System On: 7E <dev> 09 01|02|03
    if( d[0] === 0x7e && d[2] === 0x09 && (d[3] === 1 || d[3] === 2 || d[3] === 3) ) return true;
    // GS Reset: 41 <dev> 42 12 40 00 7F 00 <checksum>
    if( d[0] === 0x41 && d[2] === 0x42 && d[3] === 0x12 && eq(d, 4, [0x40, 0x00, 0x7f, 0x00]) ) return true;
    // XG System On: 43 1n 4C 00 00 7E 00
    if( d[0] === 0x43 && (d[1] & 0xf0) === 0x10 && d[2] === 0x4c && eq(d, 3, [0x00, 0x00, 0x7e, 0x00]) ) return true;
    return false;
}
