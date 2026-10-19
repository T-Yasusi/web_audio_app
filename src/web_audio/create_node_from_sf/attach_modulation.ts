import { timecents } from '../util_funcs.ts'

type Target = { detune: AudioParam; cutoff: AudioParam; trem: GainNode | null; vib_depth?: AudioNode };

// モジュレーションエンベロープと LFO をボイスにつなぐ。作ったノードを返す(終了時に disconnect する)
export default function attach_modulation(context: AudioContext, p: Record<string, number>,
					  t0: number, duration: number, t_end: number, target: Target) {
    const nodes: AudioNode[] = [];

    // src(-1〜1 または 0〜1)に量を掛けて、param に足し込む
    const route = (src: AudioNode, amount: number, param: AudioParam) => {
        const g = context.createGain();
        g.gain.value = amount;
        src.connect(g);
        g.connect(param);
        nodes.push(g);
    };

    // モジュレーションエンベロープ(0〜1)
    if( p.mod_env_to_pitch !== 0 || p.mod_env_to_filter_Fc !== 0 ){
        const env = context.createConstantSource();
        env.offset.value = 0;
        schedule_mod_env(env.offset, t0, duration, p);
        env.start(t0);
        env.stop(t_end);
        nodes.push(env);
        if( p.mod_env_to_pitch !== 0 ) route(env, p.mod_env_to_pitch, target.detune);
        if( p.mod_env_to_filter_Fc !== 0 ) route(env, p.mod_env_to_filter_Fc, target.cutoff);
    }

    // モジュレーション LFO: ピッチ、フィルタ、音量
    if( p.mod_lfo_to_pitch !== 0 || p.mod_lfo_to_filter_Fc !== 0 || target.trem ){
        const lfo = make_lfo(context, t0, t_end, p.delay_mod_lfo, p.freq_mod_lfo);
        nodes.push(lfo);
        if( p.mod_lfo_to_pitch !== 0 ) route(lfo, p.mod_lfo_to_pitch, target.detune);
        if( p.mod_lfo_to_filter_Fc !== 0 ) route(lfo, p.mod_lfo_to_filter_Fc, target.cutoff);
        if( target.trem ){
            const shaper = context.createWaveShaper();
            shaper.curve = tremolo_curve(p.mod_lfo_to_volume);
            target.trem.gain.value = 0;              // WaveShaper の出力が、そのままゲインになる
            lfo.connect(shaper);
            shaper.connect(target.trem.gain);
            nodes.push(shaper);
        }
    }

    if( p.vib_lfo_to_pitch !== 0 || target.vib_depth ){
//	console.log(target.vib_depth);
//	throw new Error('tmp');
	const lfo = make_lfo(context, t0, t_end, p.delay_vib_lfo, p.freq_vib_lfo);
	nodes.push(lfo);
	if( p.vib_lfo_to_pitch !== 0 ) route(lfo, p.vib_lfo_to_pitch, target.detune);
	if( target.vib_depth ){
//	    console.log('Call Vibrate Depth');
            const g = context.createGain();
            g.gain.value = 0;                  // 実効ゲイン = チャンネルの深さ(セント)
            target.vib_depth.connect(g.gain);  // 深さを、ゲインに信号として足す
            lfo.connect(g);
            g.connect(target.detune);
            nodes.push(g);
//	    g.gain.onended = ()=> { console.log('Call onended'); }
//            cleanups.push(() => target.vib_depth!.disconnect(g.gain));
	}
    }
    
    return nodes;
}

// SF2 の LFO は三角波。ディレイの間は出力0で、その後ゼロから立ち上がる
function make_lfo(context: AudioContext, t0: number, t_end: number, delay_tc: number, freq_cents: number) {
    const osc = context.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 8.176 * 2 ** (freq_cents / 1200);
    osc.start(t0 + timecents(delay_tc));
    osc.stop(t_end);
    return osc;
}

// 入力 -1〜1 → 振幅の倍率 10^(x × cB/200)。cB ごとにキャッシュする
const curves = new Map<number, Float32Array>();
function tremolo_curve(cB: number) : Float32Array<ArrayBuffer> {
    let c = curves.get(cB);
    if( !c ){
        c = new Float32Array(129);
        for( let i = 0; i < 129; i++ ) c[i] = 10 ** ((i / 64 - 1) * cB / 200);
        curves.set(cB, c);
    }
    return c as Float32Array<ArrayBuffer>;
}

// モジュレーションエンベロープ(0〜1)の予約。値そのものが線形(音量エンベロープとは違う)
function schedule_mod_env(g: AudioParam, t0: number, duration: number, p: Record<string, number>) {
    const delay = timecents(p.delay_mod_env), attack = timecents(p.attack_mod_env);
    const hold = timecents(p.hold_mod_env), decay = timecents(p.decay_mod_env);
    const release = timecents(p.release_mod_env);
    const sustain = Math.min(1, Math.max(0, 1 - p.sustain_mod_env / 1000));

    const t_off = t0 + duration;
    const t_a0 = t0 + delay, t_a1 = t_a0 + attack, t_h1 = t_a1 + hold;
    const t_d1 = t_h1 + decay * (1 - sustain);               // 全振幅(1→0)が decay 秒

    g.setValueAtTime(0, t0);
    let level: number;                                       // ノートオフ時点の値
    if( t_off <= t_a0 ) level = 0;
    else{
        g.setValueAtTime(0, t_a0);
        if( t_off <= t_a1 ){                                 // アタックの途中
            level = (t_off - t_a0) / attack;
            g.linearRampToValueAtTime(level, t_off);
        }
        else{
            g.linearRampToValueAtTime(1, t_a1);
            if( t_off <= t_h1 ) level = 1;                   // ホールドの途中
            else{
                g.setValueAtTime(1, t_h1);
                if( t_off < t_d1 ){                          // ディケイの途中
                    level = 1 - (t_off - t_h1) / decay;
                    g.linearRampToValueAtTime(level, t_off);
                }
                else{                                        // サスティン
                    level = sustain;
                    if( t_d1 > t_h1 ) g.linearRampToValueAtTime(sustain, t_d1);
                }
            }
        }
    }
    // リリース: 現在値から0へ線形。1→0 が release 秒なので、level から0までは release × level 秒
    if( level > 0 ){
        g.setValueAtTime(level, t_off);                      // ランプの開始点を、ノートオフの時刻に固定する
        g.linearRampToValueAtTime(0, t_off + release * level);
    }
}
