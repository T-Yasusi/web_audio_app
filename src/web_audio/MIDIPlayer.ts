import type { MidiFile, Event, Note, MidiEvent } from '../midi/types.ts'
import type { Preset } from '../sf/types.ts'
import Channel from './Channel.ts'
import Reverb from './Reverb.ts'
import Chorus from './Chorus.ts'
import build_table from './build_table.ts'
import calc_time from './calc_time.ts'

const LEAD = 0.05;        // 再生開始までの余裕(秒)
import create_voice from './create_voice.ts'

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
    
    constructor(context: AudioContext, gain: GainNode, presets: Preset[], midi_json: MidiFile){
	this.context = context
	this.presets = new Map(presets.map((p: Preset) => [p.bank * 128 + p.MIDInumber, p]));
	this.time_table = build_table(midi_json);
	this.events = midi_json.tracks.flat().sort((a: Event, b: Event) => a.tick - b.tick);
	this.channels = Array.from({ length: 16 }, () => new Channel(context, gain) );
	this.reverb = new Reverb(context, gain);
	this.chorus = new Chorus(context, gain);
	this.base_offset = context.currentTime + LEAD;
    }

    duration(){
	let max = 0;
	for( const event of this.events ){
	    const time = calc_time(event.tick, this.time_table);
	    const end = (event as Note).endTick ? calc_time((event as Note).endTick, this.time_table) : 0;
	    max = Math.max(time, end, max);
	}
	return max;
    }
    
    find_preset(event: Note){
	const bank = event.channel === 9 ? 128 : this.bank[event.channel];
	const program = this.program[event.channel];
        const base = bank === 128 ? 128 : 0;
        return this.presets.get(bank * 128 + program) ?? this.presets.get(base * 128 + program) ?? this.presets.get(base * 128);
    }
    
    apply_event(index: number){
	const event = this.events[index];
	const start = calc_time(event.tick, this.time_table);

	if( event.type === 'programChange' ) this.program[(event as MidiEvent).channel] = (event as MidiEvent).data;
	else if( event.type === 'note' ){
	    const note = event as Note;
	    const preset = this.find_preset(note);
	    if( !preset ) return;
	    const stop = calc_time(note.endTick, this.time_table);

            const gain = create_voice(this.context, note.midi_note, note.velocity,
                                      start + this.base_offset - this.time_offset, stop - start,
				      preset, this.channels[note.channel],
                                      this.reverb, this.chorus,
                                      { release_scale: note.release_scale, soft: note.soft });

            gain.connect(this.channels[note.channel].input);
	}
	else{
	    const ev = event as MidiEvent;
	    const data = ev.data as [ number, number ];
	    
	    if( event.type === 'controlChange' && data[0] === 0 ) this.bank[ev.channel] = data[1];
	    else if( event.type === 'pitchBend' )
		this.channels[ev.channel].update_bend(start, ((data[1] << 7) | data[0]) - 8192); // -8192〜8191
	    else if( event.type === 'controlChange' )
		this.channels[ev.channel].change_state(start, data[0], data[1]);
	}
    }
}

export default MIDIPlayer;
