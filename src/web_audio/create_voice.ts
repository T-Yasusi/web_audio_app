import type { Preset } from '../sf/types.ts'
import is_match_zone from './create_voice/is_match_zone.ts'
import calc_params from './create_voice/calc_params.ts'
import createADSREnvelope from './create_voice/createADSREnvelope.ts'
import create_buffer_source from './create_voice/create_buffer_source.ts'
import create_filter_panner from './create_voice/create_filter_panner.ts'
import attach_modulation from './create_voice/attach_modulation.ts'

import Channel from './Channel.ts'
import Reverb from './Reverb.ts'
import Chorus from './Chorus.ts'
import { REVERB_CC_MAX, CHORUS_CC_MAX } from './global_vals.ts'

const CHOKE_FADE = 0.02;   // 排他クラスで止めるときのフェードアウト(秒)

// ゾーンごとの「止める」ためのハンドル。同じ排他クラスの次のノートが来たときに使う
export type ZoneVoice = { exclusive_class: number; start_time: number; end_time: number; choke: (time: number) => void };
export type Voice = { output: GainNode; zones: ZoneVoice[] };

export default function create_voice(context: AudioContext, note: number, vel: number,
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
	    
            const p = calc_params(iz, inst, pz, preset, note, opts);	    
            const source = create_buffer_source(context, note, iz.sample, iz, inst, p);

            const { amp, end_time } = createADSREnvelope(context, start_time, vel, duration, p);
	    const { filter, panner } = create_filter_panner(context, p);
            // 排他クラス用のゲイン。ソースの直後に置くので、止めればエフェクト送りも一緒に消える
            const cut = context.createGain();
            source.connect(cut);
            cut.connect(amp);
            amp.connect(filter);
            filter.connect(panner);
            const trem = p.mod_lfo_to_volume !== 0 ? context.createGain() : null;
	    if( trem ){
		panner.connect(trem);
		trem.connect(merger);
	    }
	    else panner.connect(merger);
	    
            channel.bend.connect(source.detune);     // ← 追加: ピッチベンド
            channel.pan.connect(panner.pan);         // ← 追加: CC10
            const dispose: (() => void)[] = [
                () => channel.bend.disconnect(source.detune),
                () => channel.pan.disconnect(panner.pan),
            ];

            const nodes = attach_modulation(context, p, start_time, duration, end_time,
					    { detune: source.detune, cutoff: filter.detune, trem, vib_depth: channel.vib, dispose });

	    if( p.reverb_effect_send > 0 || channel.state.reverb > 0 ){
		const send_gen = p.reverb_effect_send / 1000 + channel.state.reverb / 127 * REVERB_CC_MAX;
		const send = context.createGain();
		send.gain.value = send_gen;
		panner.connect(send);
		send.connect(reverb.input);
		nodes.push(send);
	    }
	    
	    if( p.chorus_effect_send > 0 || channel.state.chorus > 0 ){
		const send_gen = p.chorus_effect_send / 1000 + channel.state.chorus / 127 * CHORUS_CC_MAX;
		const send = context.createGain();
		send.gain.value = send_gen;
		panner.connect(send);
		send.connect(chorus.input);
		nodes.push(send);
	    }
	    	    		
            active++;
            source.onended = () => {
		source.disconnect(); cut.disconnect(); amp.disconnect(); filter.disconnect(); panner.disconnect();
                // チャンネル共有ノード(bend / pan / vib)からの接続を外す。外さないと、鳴らした音符の数だけ接続が溜まる
                dispose.forEach(f => f());
		
                if( --active === 0 ){
		    merger.disconnect();
		    nodes.forEach(a => a.disconnect());
		    if( trem ) trem.disconnect();
		}
	    };
            source.start(start_time);
            source.stop(end_time);   // 実時間で止める(start の第3引数は使わない)

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
                    source.stop(Math.min(end_time, t + CHOKE_FADE));   // stop は後から呼び直せる(最後の呼び出しが有効)
                },
            });
        }
    }
    return { output: merger, zones };
}
