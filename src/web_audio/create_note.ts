import type { Preset } from '../sf/types.ts'
import is_match_zone from './create_note/is_match_zone.ts'
import calc_params from './create_note/calc_params.ts'
import createADSREnvelope from './create_note/createADSREnvelope.ts'
import create_buffer_source from './create_note/create_buffer_source.ts'
import create_filter_panner from './create_note/create_filter_panner.ts'
import attach_modulation, { lazy_vib } from './create_note/attach_modulation.ts'
import DynamicVoice, { set_param, lazy_send } from './create_note/dynamic_voice.ts'
import { dynamic_modulators } from './create_note/modulator.ts'

import Channel from './Channel.ts'
import Reverb from './Reverb.ts'
import Chorus from './Chorus.ts'

// 動的なモジュレータ経由に移した宛先
const DYNAMIC_DESTS = new Set(['pan', 'reverb_effect_send', 'chorus_effect_send', 'vib_lfo_to_pitch', 'fine_tune']); 
const CHOKE_FADE = 0.02;   // 排他クラスで止めるときのフェードアウト(秒)

// ゾーンごとの「止める」ためのハンドル。同じ排他クラスの次のノートが来たときに使う
export type ZoneVoice = { exclusive_class: number; start_time: number; end_time: number; choke: (time: number) => voisd };
export type Voice = { output: GainNode; zones: ZoneVoice[] };

export default function create_note(context: AudioContext, note: number, vel: number,
                                    start_time: number, duration: number, preset: Preset, channel: Channel,
				    reverb: Reverb, chorus: Chorus,
				    opts: { release_scale?: number; soft?: boolean } = {}): Voice {
    const zones: ZoneVoice[] = [];
    const merger = context.createGain();
    let active = 0;   // 鳴っているボイスの数

    for( const pz of preset.zones ){
        if( !is_match_zone(note, vel, pz) ) continue;
	if( !pz.instrument ) continue
        const inst = pz.instrument;
        for( const iz of inst.zones ){
            if( !is_match_zone(note, vel, iz) ) continue;
	    if( !iz.sample ) continue;
	    
            const p = calc_params(iz, inst, pz, preset, note, vel, opts);	    
            const source = create_buffer_source(context, note, iz.sample, iz, inst, p);
            const detune_base = source.detune.value;   // ルートキー、チューニング、サンプルの補正などの合計。動的な分は、これに足す
	    
            const { amp, end_time } = createADSREnvelope(context, start_time, duration, p);
//            const { amp, end_time } = createADSREnvelope(context, start_time, vel, duration, p);
	    const { filter, panner } = create_filter_panner(context, p);
            // 排他クラス用のゲイン。ソースの直後に置くので、止めればエフェクト送りも一緒に消える
            const cut = context.createGain();
	    const trem = context.createGain();
            source.connect(cut);
            cut.connect(amp);
            amp.connect(filter);
            filter.connect(panner);
	    panner.connect(trem);
	    trem.connect(merger);

	    channel.tune.connect(source.detune);   // RPN 1/2 のチューニング
            const dispose: (() => void)[] = [
		() => {
		    source.disconnect(); cut.disconnect(); amp.disconnect(); filter.disconnect(); panner.disconnect();
		    channel.tune.disconnect(source.detune);
		    trem.disconnect();
		}
            ];
	    
	    // 動的なモジュレータ(CC など)の反映。移行済みの宛先だけをここで扱う(パン、リバーブ送り、コーラス送り、ビブラート、ピッチベンド)
            const dyn = new DynamicVoice(dynamic_modulators(iz, inst, pz, preset, DYNAMIC_DESTS), {
                pan: { base: p.pan, min: -500, max: 500, apply: (v, t) => set_param(panner.pan, v / 500, t) }, // 範囲は calc_params の GEN.pan と同じ
		reverb_effect_send: { base: p.reverb_effect_send, min: 0, max: 1000, apply: lazy_send(context, panner, reverb.input, dispose) },
                chorus_effect_send: { base: p.chorus_effect_send, min: 0, max: 1000, apply: lazy_send(context, panner, chorus.input, dispose) },
		// ピッチベンド(既定モジュレータの fine_tune)。生成子の ±99 セントの制限は受けない(ベンドは ±数百〜数千セント)。
                // 生成子の分(p.fine_tune)は detune_base に入っているので、ここでの値はモジュレータの出力だけ
                fine_tune: { base: 0, min: -12700, max: 12700, apply: (v, t) => set_param(source.detune, detune_base + v, t) },
		vib_lfo_to_pitch: { base: p.vib_lfo_to_pitch, min: -12000, max: 12000, apply:
				    lazy_vib(context, p, start_time, end_time, source.detune, dispose) },
            }, note, vel);
            if( !dyn.empty ){
                dyn.update(null, channel.controllers());     // 今の値で初期化する(すぐに反映)
                channel.add_voice(dyn);
                dispose.push(() => channel.remove_voice(dyn));
            }
	    
            attach_modulation(context, p, start_time, duration, end_time,
			      { detune: source.detune, cutoff: filter.detune, trem, dispose });

            active++;
            source.onended = () => {
		// チャンネル共有ノード(tune)や、チャンネルへのボイスの登録を外す。外さないと、鳴らした音符の数だけ接続が溜まる
                dispose.forEach(f => f());

                if( --active === 0 ){
		    merger.disconnect();
		}
	    };
            source.start(start_time);
            source.stop(end_time);

            // exclusive_class はインストゥルメント側だけの値。プリセット側の値は足さない
            const ec = Number(iz.generators.exclusive_class ?? inst.global_zone?.generators.exclusive_class ?? 0);
            let choked = false;
            zones.push({
                exclusive_class: ec, start_time, end_time,
                choke: (time: number) => {
                    if( choked || time >= end_time ) return;    // もう止めた、または自然に止まっている
                    choked = true;
                    const t = Math.max(time, start_time);
                    cut.gain.setValueAtTime(1, t);
                    cut.gain.linearRampToValueAtTime(0, t + CHOKE_FADE);
                    source.stop(Math.min(end_time, t + CHOKE_FADE));
                },
            });
        }
    }
    return { output: merger, zones };
}
