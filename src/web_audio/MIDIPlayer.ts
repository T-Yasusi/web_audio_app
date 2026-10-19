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
    presets: Map<number, any>;
    time_table: { ticks: number[]; secs: number[]; rates: number[] };
    events: Array<any>;
    reverb: Reverb;
    chorus: Chorus;
    program = new Array(16).fill(0);
    bank =  new Array(16).fill(0);
    channels: Array<Channel>;
    index = 0;
    time = 0;
    constructor(context: AudioContext, gain: AudioNode, sf_json: any, midi_json: any){
	this.context = context;
	this.base_time = context.currentTime;
	this.presets = new Map(sf_json.presets.map((p: any) => [p.bank * 128 + p.MIDInumber, p]));
	this.time_table = build_table(midi_json);
	this.events = midi_json.tracks.flat().sort((a: any, b:any) => a.tick - b.tick);
	this.channels = Array.from({ length: 16 }, () => new Channel(context, gain) );
	this.reverb = new Reverb(context);
	this.chorus = new Chorus(context);
    }

    find_preset(event: any){
	const bank = event.channel === 9 ? 128 : this.bank[event.channel];
	const program = this.program[event.channel];
        const base = bank === 128 ? 128 : 0;
        return this.presets.get(bank * 128 + program) ?? this.presets.get(base * 128 + program) ?? this.presets.get(base * 128);
    }
    
    apply_event(index: number){
	const event = this.events[index];
	const start = calc_time(event.tick, this);

	if( event.type === 'note' ){
	    const preset = this.find_preset(event);
	    if( !preset ) return;
	    const stop = calc_time(event.endTick, this);

            const gain = create_node_from_sf(this.context, event.midi_note, event.velocity,
                                             this.base_time + start, stop - start, preset, this.channels[event.channel],
                                             this.reverb, this.chorus,
                                             { release_scale: event.release_scale, soft: event.soft });

            gain.connect(this.channels[event.channel].input);
//	    console.log(preset, stop, gain);
	}
	else if( event.type === 'programChange' ) this.program[event.channel] = event.data;
	else if( event.type === 'controlChange' && event.data[0] === 0 ) this.bank[event.channel] = event.data[1];
	else if( event.type === 'pitchBend' )
	    this.channels[event.channel].update_bend(start, ((event.data[1] << 7) | event.data[0]) - 8192); // -8192〜8191
	else{
	    const [cc, value] = event.data;
	    const s = this.channels[event.channel].state;
	    if( cc === 6 && s.rpn_msb === 0 && s.rpn_lsb === 0 )  // RPN 0: ピッチベンドの幅(半音)
		this.channels[event.channel].update_bend(start, value);	
	    if( cc === 7 || cc === 11 ){
		if( cc === 7 ) s.volume = value; else s.expression = value;
		this.channels[event.channel].input.gain.setTargetAtTime(concave(s.volume) * concave(s.expression), start, SMOOTH);
            }
	    else if( cc === 10 ) this.channels[event.channel].pan.offset.setTargetAtTime(Math.max(-1, (value - 64) / 63), start, SMOOTH);
            else if( cc === 91 ) s.reverb = value;
            else if( cc === 93 ) s.chorus = value;
            else if( cc === 101 ) s.rpn_msb = value;
            else if( cc === 100 ) s.rpn_lsb = value;
	    else if( cc === 121 ) this.channels[event.channel].reset_state(start);	    
	}
    }
}

export default MIDIPlayer;

// function update_bend(channel: Channel, time: number){
//     const cents = channel.state.bend / 8192 * channel.state.bend_range * 100;
//     channel.bend.offset.setTargetAtTime(cents, time, SMOOTH);
// }
    
function build_table(midi_json: any) {
    const { tempos, division } = midi_json;
    const ticks: number[] = [], secs: number[] = [], rates: number[] = [];
    let sec = 0;

    for( let i = 0; i < tempos.length; i++ ){
        if( i > 0 ) sec += (tempos[i].tick - tempos[i-1].tick) * tempos[i-1].data / division / 1e6;
        ticks.push(tempos[i].tick);
        secs.push(sec);
        rates.push(tempos[i].data / division / 1e6);
    }
    return { ticks, secs, rates };
}

