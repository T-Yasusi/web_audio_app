import readVLQ from './readVLQ.ts'
import parse_midi_event from './parse_midi_event.ts'
import parse_meta_event from './parse_meta_event.ts'
import parse_sysex_event from './parse_sysex_event.ts'

type MidiObj = Record<string, any>;
type Result = { obj: MidiObj; offset: number; status: number };

// status: 直前のチャンネルメッセージのステータス(ランニングステータス)。なければ 0
export default function readEvent(view: DataView, offset: number, tick: number, status = 0): Result {
    const obj: MidiObj = { tick };
    const byte = view.getUint8(offset);

    if( byte === 0xff ) return { ...parse_meta_event(view, offset + 1, obj), status };
    if( byte === 0xf0 || byte === 0xf7 ) return { ...parse_sysex_event(view, byte, offset + 1, obj), status };
    if( byte >= 0xf0 ) throw new Error(`MIDI: SMFでは使えないステータスです: 0x${byte.toString(16)}`);

    if( byte >= 0x80 ) { status = byte; offset++; }   // 新しいステータス
    else if( status === 0 ) throw new Error('MIDI: ステータスがなく、ランニングステータスもありません');
    // byte < 0x80 は省略されたステータス。offset は進めず、データバイトとして読む

    return { ...parse_midi_event(view, status, offset, obj), status };
}

