import { ATTEN_SCALE } from '../global_vals.ts'
import { timecents } from '../util_funcs.ts'

export default function createADSREnvelope(context: AudioContext, t0: number, vel: number, duration: number, p: Record<string, number>) {
    const base = 10 ** (-(p.init_attenuation * ATTEN_SCALE) / 200) * (vel / 127) ** 2;
    const amp = context.createGain();
    
    const delay = timecents(p.delay_vol_env), attack = timecents(p.attack_vol_env);
    const hold = timecents(p.hold_vol_env), decay = timecents(p.decay_vol_env);
    const release = timecents(p.release_vol_env);
    const sustain_db = p.sustain_vol_env / 10;               // cB → dB(減衰量)
    const sustain = base * 10 ** (-sustain_db / 20);

    const t_off = t0 + duration;
    const t_a0 = t0 + delay, t_a1 = t_a0 + attack, t_h1 = t_a1 + hold;
    const t_d1 = t_h1 + decay * sustain_db / 100;            // サスティンに達する時刻

    amp.gain.setValueAtTime(0, t0);
    let level: number;                                       // ノートオフ時点の振幅
    if( t_off <= t_a0 ) level = 0;                           // ディレイの途中
    else{
        amp.gain.setValueAtTime(0, t_a0);
        if( t_off <= t_a1 ){                                 // アタックの途中
            level = base * (t_off - t_a0) / attack;
            amp.gain.linearRampToValueAtTime(level, t_off);
        }
        else{
            amp.gain.linearRampToValueAtTime(base, t_a1);
            if( t_off <= t_h1 ) level = base;                // ホールドの途中
            else{
                amp.gain.setValueAtTime(base, t_h1);
                if( t_off < t_d1 ){                          // ディケイの途中
                    level = base * 10 ** (-5 * (t_off - t_h1) / decay);
                    amp.gain.exponentialRampToValueAtTime(level, t_off);
                }
                else{                                        // サスティン
                    level = sustain;
                    if( t_d1 > t_h1 ) amp.gain.exponentialRampToValueAtTime(sustain, t_d1);
                    amp.gain.setValueAtTime(sustain, t_off);
                }
            }
        }
    }
    // リリース: ノートオフ時点の値から、dB 一定の傾きで下げる(時定数 = release / (5 ln10))
    if( level > 0 ) amp.gain.setTargetAtTime(0, t_off, release / 11.513);
    const end_time = t_off + release;
    return { amp, end_time }
}
