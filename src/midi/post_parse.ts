import type { MidiInfo, MidiFile } from './types.ts'
import type { Event, MidiEvent, Note } from './types.ts'
import adjust_note_ends from './adjust_note_ends.ts'

const DEFAULT_TEMPO = 500000;   // 120BPM (SMFの既定値)

export default function build_song(json: MidiInfo) : MidiFile{
    if( json.format === 2 ) throw new Error('フォーマット2はサポートしていません');

    // テンポは全トラックから集めて tick 順に並べる(通常は Track 0 にある)
    const tempos = json.tracks.flat()
        .filter((e: Event) => e.event === 'Meta' && e.type === 'Set Tempo')
        .sort((a: Event, b: Event) => a.tick - b.tick);
    if( tempos.length === 0 || tempos[0].tick > 0 )
        tempos.unshift({ tick: 0, event: 'Meta', type: 'Set Tempo', id: 0x51, data: DEFAULT_TEMPO });

    // ノートは全トラックから作る。MIDIイベントのないトラック(テンポ専用トラックなど)は除く
    const tracks = json.tracks.map(build_track).filter((t: Event[]) => t.length > 0);

    adjust_note_ends(json.tracks.flat(), tracks.flat());   // 元のイベント(CC)と、組み立てたノートを渡す
    return { format: json.format, division: json.division, tempos, tracks };
}

function build_track(events: Event[]) {
    const track = new Array<Event>();
    const active = new Map();   // channel*128+note -> 鳴っているノートの配列(古い順)
    let last_tick = 0;

    for( const event of events ){
        last_tick = event.tick;
	const ev = event as MidiEvent;
        if( event.event !== 'midi' ) continue;

        if( event.type === 'noteOn' || event.type === 'noteOff' ){
            const key = ev.channel * 128 + (ev.data as [ number, number ])[0];

            if( event.type === 'noteOn' && (ev.data as [ number, number])[1] > 0 ){
                const note : Note = { event: 'midi',
				      type: 'note',
				      channel: ev.channel,
				      midi_note: (ev.data as [ number, number])[0],
				      velocity: (ev.data as [number, number])[1],
				      tick: event.tick, endTick: -1 };
                if( !active.has(key) ) active.set(key, []);
                active.get(key).push(note);
                track.push(note);   // NoteOn の位置に置く。ファイルの順序が保たれ、sort が要らない
            }
            else{
                // noteOff、またはベロシティ0の noteOn。古いノートから閉じる
                const note = active.get(key)?.shift();
                if( note ) note.endTick = event.tick;   // 鳴っていないノートへの NoteOff は無視
            }
        }
        else track.push(event);
    }

    // 閉じられなかったノートは、トラックの終わり(End of Track があればその tick)で止める
    let unclosed = 0;
    for( const list of active.values() )
        for( const note of list ){ note.endTick = last_tick; unclosed++; }
    if( unclosed > 0 ) console.warn(`NoteOffのないノートを ${unclosed} 個、トラック終端で止めました`);

    return track;
}
