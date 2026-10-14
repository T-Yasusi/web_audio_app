import is_match_zone from './create_node_from_sf/is_match_zone.ts'
import calc_params from './create_node_from_sf/calc_params.ts'
import createADSREnvelope from './create_node_from_sf/createADSREnvelope.ts'
import create_buffer_source from './create_node_from_sf/create_buffer_source.ts'
import create_filter_panner from './create_node_from_sf/create_filter_panner.ts'
import attach_modulation from './create_node_from_sf/attach_modulation.ts'

import type { Channel } from './channel.ts'


export default function create_node_from_sf(context: AudioContext, note: number, vel: number,
                                            start_time: number, duration: number, preset: any, channel: Channel,
					    opts: { release_scale?: number; soft?: boolean } = {}) {
    const merger = context.createGain();
    let active = 0;   // 鳴っているボイスの数

    for( const pz of preset.zones ){
        if( !is_match_zone(note, vel, pz) ) continue;
        const inst = pz.instrument;
        for( const iz of inst.zones ){
            if( !is_match_zone(note, vel, iz) ) continue;

            // モジュレータは未対応(無視する)
            const p = calc_params(iz, inst, pz, preset, note, opts);
	    
            const source = create_buffer_source(context, note, iz.sample, iz, inst, p);

            // 音量: 減衰とベロシティ((vel/127)^2 は SF2 の既定カーブ)
            const { amp, end_time } = createADSREnvelope(context, start_time, vel, duration, p);
	    const { filter, panner } = create_filter_panner(context, p);
	    source.connect(amp);
            amp.connect(filter);
            filter.connect(panner);
            panner.connect(merger);
	    
            channel.bend.connect(source.detune);     // ← 追加: ピッチベンド
            channel.pan.connect(panner.pan);         // ← 追加: CC10

            const trem = p.mod_lfo_to_volume !== 0 ? context.createGain() : null;	    
            const extra = attach_modulation(context, p, start_time, duration, end_time,
                                            { detune: source.detune, cutoff: filter.detune, trem });
	    
	    let tail: AudioNode = amp;
            if( trem ){ amp.connect(trem); tail = trem; }
	    
            active++;
            source.onended = () => {
                source.disconnect(); amp.disconnect(); filter.disconnect(); panner.disconnect();
                if( --active === 0 ) merger.disconnect();
            };
            source.start(start_time);
            source.stop(end_time);   // 実時間で止める(start の第3引数は使わない)
        }
    }
    return merger;
}
