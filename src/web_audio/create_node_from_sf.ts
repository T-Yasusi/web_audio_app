import applyADSREnvelope from './create_node_from_sf/applyADSREnvelope.ts'
import calc_params from './create_node_from_sf/calc_params.ts'
import create_buffer_source from './create_node_from_sf/create_buffer_source.ts'
import is_match_zone from './create_node_from_sf/is_match_zone.ts'

import type { Channel } from './channel.ts'
import { attach_modulation } from './create_node_from_sf/modulation.ts'

const ATTEN_SCALE = 0.4;   // init_attenuation の係数(FluidSynth 互換。仕様の本文どおりなら 1.0)

const SOFT_GAIN = 10 ** (-3 / 20);   // CC67: 音量 -3dB(量は好みで調整)
const SOFT_CUTOFF = -1200;           // CC67: カットオフを1オクターブ下げる(同上)

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
            const p = calc_params(iz, inst, pz, preset, note);

            // ハーフペダル: リリース時間を倍率で伸ばす(タイムセントでは 1200 × log2(倍率) を足す)
            if( opts.release_scale && opts.release_scale !== 1 ){
                const tc = 1200 * Math.log2(opts.release_scale);
                p.release_vol_env += tc;
                p.release_mod_env += tc;
            }
            // ソフトペル: カットオフを下げる(音量は下の base に掛ける)
            if( opts.soft ) p.init_filter_Fc = Math.max(1500, p.init_filter_Fc + SOFT_CUTOFF);
	    
            const source = create_buffer_source(context, note, iz.sample, iz, inst, p);

            // 音量: 減衰とベロシティ((vel/127)^2 は SF2 の既定カーブ)
            const base = 10 ** (-(p.init_attenuation * ATTEN_SCALE) / 200) * (vel / 127) ** 2;
            const amp = context.createGain();
            const t_end = applyADSREnvelope(amp.gain, start_time, duration, p, base);

            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 8.176 * 2 ** (p.init_filter_Fc / 1200);
            filter.Q.value = p.init_filter_Q / 10 - 3.01;   // cB → dB。Q=0 で共振なし(約 -3.01dB)

            const panner = context.createStereoPanner();
            panner.pan.value = p.pan / 500;

            channel.bend.connect(source.detune);     // ← 追加: ピッチベンド
            channel.pan.connect(panner.pan);         // ← 追加: CC10

            const trem = p.mod_lfo_to_volume !== 0 ? context.createGain() : null;	    
            const extra = attach_modulation(context, p, start_time, duration, t_end,
                                            { detune: source.detune, cutoff: filter.detune, trem });
	    
            source.connect(amp);
	    let tail: AudioNode = amp;
            if( trem ){ amp.connect(trem); tail = trem; }
            amp.connect(filter);
            filter.connect(panner);
            panner.connect(merger);

            active++;
            source.onended = () => {
                source.disconnect(); amp.disconnect(); filter.disconnect(); panner.disconnect();
                if( --active === 0 ) merger.disconnect();
            };
            source.start(start_time);
            source.stop(t_end);   // 実時間で止める(start の第3引数は使わない)
        }
    }
    return merger;
}
