import schedule_volume from './create_node_from_sf/schedule_volume.ts'
import calc_params from './create_node_from_sf/calc_params.ts'
import get_buffer from './create_node_from_sf/get_buffer.ts'
import is_match_zone from './create_node_from_sf/is_match_zone.ts'

import type { Channel } from './channel.ts'

const ATTEN_SCALE = 0.4;   // init_attenuation の係数(FluidSynth 互換。仕様の本文どおりなら 1.0)

const inst_gen = (iz: any, inst: any, name: string) => iz.generators[name] ?? inst.global_zone?.generators[name];

export default function create_node_from_sf(context: AudioContext, note: number, vel: number,
                                            start_time: number, duration: number, preset: any, channel: Channel) {
    const merger = context.createGain();
    let active = 0;   // 鳴っているボイスの数

    for( const pz of preset.zones ){
        if( !is_match_zone(note, vel, pz) ) continue;
        const inst = pz.instrument;
        for( const iz of inst.zones ){
            if( !is_match_zone(note, vel, iz) ) continue;

            // モジュレータは未対応(無視する)
            const p = calc_params(iz, inst, pz, preset);
            const sample = iz.sample;

            const source = context.createBufferSource();
            source.buffer = get_buffer(context, sample);

            // ピッチ(セント): ルートキー、scale_tuning、coarse/fine、サンプルの補正
            const root_gen = inst_gen(iz, inst, 'overriding_root_key');
            const root = (root_gen !== undefined && root_gen >= 0) ? root_gen
                       : (sample.origin_pitch <= 127 ? sample.origin_pitch : 60);
            source.detune.value = (note - root) * p.scale_tuning + p.coarse_tune * 100 + p.fine_tune + sample.correction;

            // ループ(1: ループ, 3: ノートオフまでループ)
            const mode = (inst_gen(iz, inst, 'sample_modes') ?? 0) & 3;
            if( (mode === 1 || mode === 3) && sample.loop_end > sample.loop_start ){
                source.loop = true;
                source.loopStart = sample.loop_start / sample.sampling_rate;
                source.loopEnd = sample.loop_end / sample.sampling_rate;
            }

            // 音量: 減衰とベロシティ((vel/127)^2 は SF2 の既定カーブ)
            const base = 10 ** (-(p.init_attenuation * ATTEN_SCALE) / 200) * (vel / 127) ** 2;
            const amp = context.createGain();
            const t_end = schedule_volume(amp.gain, start_time, duration, p, base);

            const filter = context.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 8.176 * 2 ** (p.init_filter_Fc / 1200);
            filter.Q.value = p.init_filter_Q / 10 - 3.01;   // cB → dB。Q=0 で共振なし(約 -3.01dB)

            const panner = context.createStereoPanner();
            panner.pan.value = p.pan / 500;

            channel.bend.connect(source.detune);     // ← 追加: ピッチベンド
            channel.pan.connect(panner.pan);         // ← 追加: CC10
	    
            source.connect(amp);
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
