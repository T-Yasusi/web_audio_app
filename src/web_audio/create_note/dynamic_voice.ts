import type { Modulator } from '../../sf/types.ts'
import { SMOOTH } from '../global_vals.ts'
import { parse_source, source_key, dynamic_value } from './modulator.ts'
import type { Controllers } from './modulator.ts'

// 宛先(生成子)1 つ分の反映先。base はモジュレータを除いた値(calc_params の結果)
export type Target = { base: number; min: number; max: number; apply: (value: number, time: number | null) => void };

// time が null なら即座に、そうでなければ time(コンテキストの時刻)に向けてなめらかに反映する
export function set_param(param: AudioParam, value: number, time: number | null) {
    if( time === null ) param.value = value;
    else param.setTargetAtTime(value, time, SMOOTH);
}

// 鳴っている 1 つのゾーンについて、動的なモジュレータ(CC、ピッチベンドなど)の出力を、宛先に反映する
export default class DynamicVoice {
    private mods: Modulator[];
    private keys = new Set<string>();
    private targets: Record<string, Target>;
    private note: number;
    private vel: number;

    constructor(mods: Modulator[], targets: Record<string, Target>, note: number, vel: number){
        this.targets = targets;
        this.note = note;
        this.vel = vel;
        this.mods = mods.filter(m => m.gen_name in targets);
        for( const m of this.mods )
            for( const w of [m.mod_src_oper, m.mod_amt_src_oper] ){
                const k = source_key(parse_source(w));
                if( k ) this.keys.add(k);
            }
    }

    get empty() { return this.mods.length === 0; }

    // このコントローラ(source_key の値)が変わったとき、この音を計算し直す必要があるか
    uses(key: string) { return this.keys.has(key); }

    // コントローラの現在値から、宛先の値を計算し直して反映する
    update(time: number | null, ctl: Controllers) {
        const sum: Record<string, number> = {};
        for( const m of this.mods ){
            const s = dynamic_value(parse_source(m.mod_src_oper), this.note, this.vel, ctl);
            const a = dynamic_value(parse_source(m.mod_amt_src_oper), this.note, this.vel, ctl);
            if( s === null || a === null || Number.isNaN(s) || Number.isNaN(a) ) continue;
            let out = m.amount * s * a;
            if( m.mod_trans_oper === 2 ) out = Math.abs(out);
            sum[m.gen_name] = (sum[m.gen_name] ?? 0) + out;
        }
        for( const [name, t] of Object.entries(this.targets) )
            t.apply(Math.min(t.max, Math.max(t.min, t.base + (sum[name] ?? 0))), time);   // 足してから範囲に収める
    }
}

// エフェクト送り(リバーブ、コーラス)。値が 0 のうちはノードを作らず、初めて 0 を超えたときに作ってつなぐ。
// 戻り値は Target.apply として使う。value は 0〜1000(0.1% 単位)で、ゲインは value / 1000
export function lazy_send(context: BaseAudioContext, from: AudioNode, to: AudioNode, dispose: (() => void)[]) {
    let send: GainNode | null = null;
    return (value: number, time: number | null) => {
        if( !send ){
            if( value <= 0 ) return;
            const g = context.createGain();
            g.gain.value = 0;                  // 0 から始めて、なめらかに上げる(つないだ瞬間のノイズを避ける)
            from.connect(g);
            g.connect(to);
            dispose.push(() => g.disconnect());
            send = g;
        }
        set_param(send.gain, value / 1000, time);
    };
}
