import type { SysExEvent } from './types.ts'
import readVLQ from './readVLQ.ts'

export default function parse_sysex_event(view: DataView, byte: number, offset: number, tick: number) {
    const len = readVLQ(view, offset);
    const end = len.offset + len.value;
    if( end > view.byteLength ) throw new Error('MIDI: SysExの長さがファイルを超えています');
    
    const event : SysExEvent = { event: 'SysEx',
				 type: byte.toString(),
				 tick: tick,
				 data: new Uint8Array(view.buffer, view.byteOffset + len.offset, len.value) };
    return { obj: event, offset: end };
}
