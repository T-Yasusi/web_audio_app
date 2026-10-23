import type { Preset } from '../sf/types.ts'
import is_match_zone from './create_node_from_sf/is_match_zone.ts'
import calc_params from './create_node_from_sf/calc_params.ts'
import createADSREnvelope from './create_node_from_sf/createADSREnvelope.ts'
import create_buffer_source from './create_node_from_sf/create_buffer_source.ts'
import create_filter_panner from './create_node_from_sf/create_filter_panner.ts'
import attach_modulation from './create_node_from_sf/attach_modulation.ts'

import Channel from './Channel.ts'
import Reverb from './Reverb.ts'
import Chorus from './Chorus.ts'
import { REVERB_CC_MAX, CHORUS_CC_MAX } from './global_vals.ts'

export default function create_node_from_sf(context: AudioContext, note: number, vel: number,
                                            start_time: number, duration: number, preset: Preset, channel: Channel,
					    reverb: Reverb, chorus: Chorus,
					    opts: { release_scale?: number; soft?: boolean } = {}) {
    const merger = context.createGain();
    let active = 0;   // 鳴っているボイスの数

    for( const pz of preset.zones ){
        if( !is_match_zone(note, vel, pz) ) continue;
	if( !pz.instrument ) continue
        const inst = pz.instrument;
        for( const iz of inst.zones ){
            if( !is_match_zone(note, vel, iz) ) continue;
	    if( !iz.sample ) continue;
	    
            const p = calc_params(iz, inst, pz, preset, note, opts);	    
            const source = create_buffer_source(context, note, iz.sample, iz, inst, p);

            const { amp, end_time } = createADSREnvelope(context, start_time, vel, duration, p);
	    const { filter, panner } = create_filter_panner(context, p);
	    source.connect(amp);
            amp.connect(filter);
            filter.connect(panner);
            panner.connect(merger);
	    
            channel.bend.connect(source.detune);     // ← 追加: ピッチベンド
            channel.pan.connect(panner.pan);         // ← 追加: CC10

            const trem = p.mod_lfo_to_volume !== 0 ? context.createGain() : null;
            const nodes = attach_modulation(context, p, start_time, duration, end_time,
					    { detune: source.detune, cutoff: filter.detune, trem, vib_depth: channel.vib });

	    if( p.reverb_effect_send > 0 || channel.state.reverb > 0 ){
		const send_gen = p.reverb_effect_send / 1000 + channel.state.reverb / 127 * REVERB_CC_MAX;
		const send = context.createGain();
		send.gain.value = send_gen;
		panner.connect(send);
		send.connect(reverb.input);
		reverb.output.connect(merger);
	    }
	    
	    if( p.chorus_effect_send > 0 || channel.state.chorus > 0 ){
		const send_gen = p.chorus_effect_send / 1000 + channel.state.chorus / 127 * CHORUS_CC_MAX;
		const send = context.createGain();
		send.gain.value = send_gen;
		panner.connect(send);
		send.connect(chorus.input);
		chorus.output.connect(merger);
	    }
	    	    		
            active++;
            source.onended = () => {
                source.disconnect(); amp.disconnect(); filter.disconnect(); panner.disconnect();
                if( --active === 0 ){
		    merger.disconnect();
		    nodes.forEach(a => a.disconnect());
		}
	    };
            source.start(start_time);
            source.stop(end_time);   // 実時間で止める(start の第3引数は使わない)
        }
    }
    return merger;
}
