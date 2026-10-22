import type { MetaEvent } from './types.ts'
import readVLQ from './readVLQ.ts'

const META_TYPES: Record<number, string> = {
    0x00: 'Sequence Number', 0x01: 'Text Event', 0x02: 'Copyright Notice', 0x03: 'Track Name',
    0x04: 'Instrument Name', 0x05: 'Lyric', 0x06: 'Marker', 0x07: 'Cue Point',
    0x08: 'Program Name', 0x09: 'Device Name', 0x20: 'MIDI Channel Prefix', 0x21: 'MIDI Port',
    0x2f: 'End of Track', 0x51: 'Set Tempo', 0x54: 'SMPTE Offset', 0x58: 'Time Signature',
    0x59: 'Key Signature', 0x7f: 'Sequencer-Specific',
};
// 長さが固定のメタイベント
const META_LENGTH: Record<number, number> = { 0x20: 1, 0x21: 1, 0x2f: 0, 0x51: 3, 0x54: 5, 0x58: 4, 0x59: 2 };

export default function parse_meta_event(view: DataView, offset: number, tick: number) {
    const id = view.getUint8(offset++);
    const len = readVLQ(view, offset);
    const start = len.offset;
    const end = start + len.value;
    if( end > view.byteLength ) throw new Error('MIDI: メタイベントの長さがファイルを超えています');

    const expected = META_LENGTH[id];
    if( expected !== undefined && len.value !== expected )
        throw new Error(`MIDI: ${META_LENGTH[id]} の長さが不正です: ${len.value}`);

    const u8 = (i: number) => view.getUint8(start + i);

    let data;
    if( id === 0x00 ){
        if( len.value === 2 ) data = view.getUint16(start, false);   // 長さ0も許される
    }
    else if( id === 0x20 || id === 0x21 ) data = u8(0);
    else if( id === 0x2f ) { /* データなし */ }
    else if( id === 0x51 ) data = (u8(0) << 16) | (u8(1) << 8) | u8(2);   // 四分音符あたりのマイクロ秒
    else if( id === 0x54 ) data = { hr: u8(0), mn: u8(1), se: u8(2), fr: u8(3), ff: u8(4) };
    else if( id === 0x58 ) data = { nn: u8(0), dd: u8(1), cc: u8(2), bb: u8(3) };
    else if( id === 0x59 ) data = { sf: view.getInt8(start), minor: u8(1) === 1 };
    else{
        const bytes = new Uint8Array(view.buffer, view.byteOffset + start, len.value);
        // 0x01〜0x09 はテキスト。それ以外(0x7f を含む)はバイナリのまま持つ
        data = (id >= 0x01 && id <= 0x09) ? new TextDecoder().decode(bytes) : bytes;
    }
    const event : MetaEvent = { event: 'Meta', id: id, tick: tick, type: META_TYPES[id] ?? 'Unknown', data: data };
    return { obj: event, offset: end };
}
