import type { Event } from './types.ts'
import readVLQ from './readVLQ.ts'
import readEvent from './readEvent.ts'

export type MidiInfo = {
    format: number;
    ntrack: number;
    division: number;
    tracks: Array<Array<Event>>;
}

const ascii = (b: Uint8Array, pos: number) =>
    String.fromCharCode(b[pos], b[pos+1], b[pos+2], b[pos+3]);

export default function parseMidi(buffer: Uint8Array) : MidiInfo {
    if( buffer.length < 14 || ascii(buffer, 0) !== 'MThd' ) throw new Error('MIDIファイルではありません');
    const view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength);

    const header_len = view.getUint32(4, false);
    if( header_len < 6 ) throw new Error('MThdの長さが不正です');
    const format = view.getUint16(8, false);
    const ntrack = view.getUint16(10, false);
    const division = view.getUint16(12, false);

    if( format > 2 ) throw new Error(`未対応のMIDIフォーマットです: ${format}`);
    if( format === 0 && ntrack !== 1 ) throw new Error('フォーマット0のトラック数は1であるべきです');
    if( (division & 0x8000) !== 0 ) throw new Error('SMPTEモードはサポートしていません');

    const tracks = new Array<Array<Event>>();
    let pos = 8 + header_len;   // ヘッダが6より長ければ読み飛ばす

    while( tracks.length < ntrack ){
        if( pos + 8 > buffer.length ) throw new Error('トラックが途中で終わっています');
        const id = ascii(buffer, pos);
        const len = view.getUint32(pos+4, false);
        const end = pos + 8 + len;
        if( end > buffer.length ) throw new Error('トラックの長さがファイルを超えています');

        if( id !== 'MTrk' ){ pos = end; continue; }   // 未知のチャンクは読み飛ばす

        pos += 8;
        const track = new Array<Event>();
        let absoluteTick = 0;
	let status = 0;
        while( pos < end ){
            const delta = readVLQ(view, pos);
            pos = delta.offset;
            absoluteTick += delta.value;

            const ev = readEvent(view, pos, absoluteTick, status);
	    status = ev.status;
            track.push(ev.obj);
            pos = ev.offset;
        }
        if( pos !== end ) throw new Error('トラックの終端が一致しません');
        tracks.push(track);
    }
    return { format, ntrack, division, tracks };
}
