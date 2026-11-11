import type { MidiFile, Event, Note, MidiEvent, SysExEvent } from '../midi/types.ts'
import type { Preset } from '../sf/types.ts'
import Channel from './Channel.ts'
import Reverb from './Reverb.ts'
import Chorus from './Chorus.ts'
import calc_time from './calc_time.ts'
import is_system_reset from './is_system_reset.ts'

import create_note from './create_note.ts'
import type { ZoneVoice } from './create_note.ts'
import { LEAD } from './parameters.ts'

class MIDIPlayer{
    context: AudioContext
    index = 0;
    presets: Map<number, Preset>;
    time_table: { ticks: number[]; secs: number[]; rates: number[] };
    events: Array<Event>;
    reverb: Reverb;
    chorus: Chorus;
    program = new Array(16).fill(0);
    bank =  new Array(16).fill(0);
    channels: Array<Channel>;
    base_offset: number;
    time_offset = 0;
    duration: number; // 曲の長さ
    exclusive: Map<number, ZoneVoice[]> = new Map();   // キー: チャンネル * 128 + 排他クラス
    
    constructor(context: AudioContext, gain: GainNode, presets: Preset[], midi_json: MidiFile){
	this.context = context
	this.presets = new Map(presets.map((p: Preset) => [p.bank * 128 + p.MIDInumber, p]));
	this.time_table = midi_json.time_table;
	this.duration = midi_json.duration;
	this.events = midi_json.events;
	this.channels = Array.from({ length: 16 }, () => new Channel(context, gain) );
	this.reverb = new Reverb(context, gain);
	this.chorus = new Chorus(context, gain);
	this.base_offset = context.currentTime + LEAD;
    }
    
    find_preset(event: Note){
	const bank = event.channel === 9 ? 128 : this.bank[event.channel];
	const program = this.program[event.channel];
        const base = bank === 128 ? 128 : 0;
        return this.presets.get(bank * 128 + program) ?? this.presets.get(base * 128 + program) ?? this.presets.get(base * 128);
    }

    // 同じチャンネル・同じ排他クラスで、先に鳴っているゾーンを止め、新しいゾーンを登録する
    register_exclusive(channel: number, zones: ZoneVoice[], t0: number){
        for( const z of zones ){
            if( z.exclusive_class === 0 ) continue;
            const key = channel * 128 + z.exclusive_class;
            const list = (this.exclusive.get(key) ?? []).filter(v => v.end_time > t0);   // 鳴り終わったものは捨てる
            for( const v of list ) if( v.start_time < t0 ) v.choke(t0);                // 同時刻のゾーン(ステレオの左右)は止めない
            list.push(z);
            this.exclusive.set(key, list);
        }
    }

    apply_sysex(event: SysExEvent, start: number){
	if( !is_system_reset(event.data) ) return;
	for( const ch of this.channels ) ch.reset_all(start);
	this.program.fill(0);
	this.bank.fill(0);
    }

    apply_note(note: Note, start: number){
	const preset = this.find_preset(note);
	if( !preset ) return;
	const duration = calc_time(note.endTick, this.time_table) - start;
	
        const t0 = start + this.base_offset - this.time_offset;
        const { output, zones } = create_note(this.context, note.midi_note, note.velocity,
					      t0, duration,
					      preset, this.channels[note.channel],
					      this.reverb, this.chorus,
					      { release_scale: note.release_scale, soft: note.soft });
	    
        output.connect(this.channels[note.channel].input);
        this.register_exclusive(note.channel, zones, t0);
    }
    
    apply_event(index: number){
	const event = this.events[index];
	const start = calc_time(event.tick, this.time_table);
        const at = start + this.base_offset - this.time_offset;   // コンテキストの時刻(ノートの t0 と同じ基準)
	
	//	console.log('start :', start, ' Event :', event);
	if( event.type === 'note' ) this.apply_note(event as Note, start);
	else if( event.event === 'SysEx' && event.type === '240' ) this.apply_sysex(event as SysExEvent, at);
	else if( event.type === 'programChange' ) this.program[(event as MidiEvent).channel] = (event as MidiEvent).data;
	else if( event.type === 'channelPressure' )
	    this.channels[(event as MidiEvent).channel].update_pressure(at, (event as MidiEvent).data as number);
	else{
	    const ev = event as MidiEvent;
	    const data = ev.data as [ number, number ];
	    
	    if( event.type === 'controlChange' && data[0] === 0 ) this.bank[ev.channel] = data[1];
	    else if( event.type === 'pitchBend' )
		this.channels[ev.channel].update_bend(at, ((data[1] << 7) | data[0]) - 8192); // -8192〜8191
	    else if( event.type === 'controlChange' )
		this.channels[ev.channel].change_state(at, data[0], data[1]);
	}
    }
}

export default MIDIPlayer;
