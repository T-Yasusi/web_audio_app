import type { MidiFile, Event, Note, MidiEvent, MetaEvent } from '../midi/types.ts'
import type { Preset } from '../sf/types.ts'
import { SMOOTH } from './global_vals.ts'
import { concave } from './util_funcs.ts'
import Channel from './Channel.ts'
import Reverb from './Reverb.ts'
import Chorus from './Chorus.ts'
import calc_time from './calc_time.ts'

//const LEAD = 0.05;        // 再生開始までの余裕(秒)
import create_node_from_sf from './create_node_from_sf.ts'

class MIDIPlayer{
    context: AudioContext;
    base_time: number;
    presets: Map<number, Preset>;
    time_table: { ticks: number[]; secs: number[]; rates: number[] };
    events: Array<Event>;
    reverb: Reverb;
    chorus: Chorus;
    program = new Array(16).fill(0);
    bank =  new Array(16).fill(0);
    channels: Array<Channel>;

    constructor(context: AudioContext, gain: AudioNode, presets: Preset[], midi_json: MidiFile ){
	this.context = context;
	this.base_time = context.currentTime;
	this.presets = new Map(presets.map((p: Preset) => [p.bank * 128 + p.MIDInumber, p]));
	this.time_table = build_table(midi_json);
	this.events = midi_json.tracks.flat().sort((a: Event, b: Event) => a.tick - b.tick);
	this.channels = Array.from({ length: 16 }, () => new Channel(context, gain) );
	this.reverb = new Reverb(context);
	this.chorus = new Chorus(context);
    }

    find_preset(event: Note){
	const bank = event.channel === 9 ? 128 : this.bank[event.channel];
	const program = this.program[event.channel];
        const base = bank === 128 ? 128 : 0;
        return this.presets.get(bank * 128 + program) ?? this.presets.get(base * 128 + program) ?? this.presets.get(base * 128);
    }
    
    apply_event(index: number){
	const event = this.events[index];
	const start = calc_time(event.tick, this);

	if( event.type === 'note' ){
	    const note = event as Note;
	    const preset = this.find_preset(note);
	    if( !preset ) return;
	    const stop = calc_time(note.endTick, this);

            const gain = create_node_from_sf(this.context, note.midi_note, note.velocity,
                                             this.base_time + start, stop - start, preset, this.channels[note.channel],
                                             this.reverb, this.chorus,
                                             { release_scale: note.release_scale, soft: note.soft });

            gain.connect(this.channels[note.channel].input);
	}
	else if( event.type === 'programChange' ) this.program[(event as MidiEvent).channel] = (event as MidiEvent).data;
	else if( event.type === 'controlChange' ){
	    const ev = event as MidiEvent;
	    const data = ev.data as [ number, number ];
	    if( data[0] == 0 ) this.bank[ev.channel] = data[1];
	}
	else if( event.type === 'pitchBend' ){
	    const ev = event as MidiEvent;
	    const data = ev.data as [ number, number ];
	    this.channels[ev.channel].update_bend(start, ((data[1] << 7) | data[0]) - 8192); // -8192〜8191
	}
	else{
	    const ev = event as MidiEvent;
	    const [cc, value] = ev.data as [ number, number ];
	    const s = this.channels[ev.channel].state;
	    if( cc === 6 && s.rpn_msb === 0 && s.rpn_lsb === 0 )  // RPN 0: ピッチベンドの幅(半音)
		this.channels[ev.channel].update_bend(start, value);	
	    if( cc === 7 || cc === 11 ){
		if( cc === 7 ) s.volume = value; else s.expression = value;
		this.channels[ev.channel].input.gain.setTargetAtTime(concave(s.volume) * concave(s.expression), start, SMOOTH);
            }
	    else if( cc === 10 ) this.channels[ev.channel].pan.offset.setTargetAtTime(Math.max(-1, (value - 64) / 63), start, SMOOTH);
            else if( cc === 91 ) s.reverb = value;
            else if( cc === 93 ) s.chorus = value;
            else if( cc === 101 ) s.rpn_msb = value;
            else if( cc === 100 ) s.rpn_lsb = value;
	    else if( cc === 121 ) this.channels[ev.channel].reset_state(start);	    
	}
    }
}

export default MIDIPlayer;
    
function build_table(midi_json: MidiFile) {
    const { tempos, division } = midi_json;
    const ticks: number[] = [], secs: number[] = [], rates: number[] = [];
    let sec = 0;

    for( let i = 0; i < tempos.length; i++ ){
	const t1 = tempos[i] as MetaEvent;
	const t2 = tempos[i-1] as MetaEvent;
        if( i > 0 ) sec += (t1.tick - t2.tick) * (t2.data as number) / division / 1e6;
        ticks.push(t1.tick);
        secs.push(sec);
        rates.push((t1.data as number) / division / 1e6);
    }
    return { ticks, secs, rates };
}

