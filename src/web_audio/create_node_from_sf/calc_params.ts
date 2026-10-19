// const ATTEN_SCALE = 0.4;   // init_attenuation の係数(FluidSynth 互換。仕様の本文どおりなら 1.0)

// const SOFT_GAIN = 10 ** (-3 / 20);   // CC67: 音量 -3dB(量は好みで調整)
const SOFT_CUTOFF = -1200;           // CC67: カットオフを1オクターブ下げる(同上

// ジェネレータごとの [既定値, 最小, 最大]
const GEN: Record<string, [number, number, number]> = {
    init_attenuation: [0,      0,      1440],
    pan:              [0,   -500,       500],
    init_filter_Fc:   [13500, 1500,   13500],
    init_filter_Q:    [0,      0,       960],
    coarse_tune:      [0,   -120,       120],
    fine_tune:        [0,    -99,        99],
    scale_tuning:     [100,    0,      1200],
    delay_vol_env:    [-12000, -12000,  5000],
    attack_vol_env:   [-12000, -12000,  8000],
    hold_vol_env:     [-12000, -12000,  5000],
    decay_vol_env:    [-12000, -12000,  8000],
    sustain_vol_env:  [0,      0,      1440],
    release_vol_env:  [-12000, -12000,  8000],
    mod_lfo_to_pitch:     [0,        -12000, 12000],
    vib_lfo_to_pitch:     [0,        -12000, 12000],
    mod_env_to_pitch:     [0,        -12000, 12000],
    mod_lfo_to_filter_Fc: [0,        -12000, 12000],
    mod_env_to_filter_Fc: [0,        -12000, 12000],
    mod_lfo_to_volume:    [0,          -960,   960],
    delay_mod_lfo:        [-12000,   -12000,  5000],
    freq_mod_lfo:         [0,        -16000,  4500],
    delay_vib_lfo:        [-12000,   -12000,  5000],
    freq_vib_lfo:         [0,        -16000,  4500],
    delay_mod_env:        [-12000,   -12000,  5000],
    attack_mod_env:       [-12000,   -12000,  8000],
    hold_mod_env:         [-12000,   -12000,  5000],
    decay_mod_env:        [-12000,   -12000,  8000],
    sustain_mod_env:      [0,            0,   1000],
    release_mod_env:      [-12000,   -12000,  8000],
    keynum_to_vol_env_hold:  [0, -1200, 1200],
    keynum_to_vol_env_decay: [0, -1200, 1200],
    keynum_to_mod_env_hold:  [0, -1200, 1200],
    keynum_to_mod_env_decay: [0, -1200, 1200],
    reverb_effect_send:      [0, 0, 1000],
    chorus_effect_send:      [0, 0, 1000], 
};
const GEN_ENTRIES = Object.entries(GEN);

export default function calc_params(iz: any, inst: any, pz: any, preset: any, note: number,
				    opts: { release_scale?: number; soft?: boolean } = {}) {
    const p: Record<string, number> = {};
    const k = 60 - note;
    for( const [name, [def, min, max]] of GEN_ENTRIES ){
        const inst_val = iz.generators[name] ?? inst.global_zone?.generators[name] ?? def;
        const preset_val = pz.generators[name] ?? preset.global_zone?.generators[name] ?? 0;
        p[name] = Math.min(max, Math.max(min, inst_val + preset_val));
    }
    p.hold_vol_env  += p.keynum_to_vol_env_hold  * k;
    p.decay_vol_env += p.keynum_to_vol_env_decay * k;
    p.hold_mod_env  += p.keynum_to_mod_env_hold  * k;
    p.decay_mod_env += p.keynum_to_mod_env_decay * k;

    // ハーフペダル: リリース時間を倍率で伸ばす(タイムセントでは 1200 × log2(倍率) を足す)
    if( opts.release_scale && opts.release_scale !== 1 ){
        const tc = 1200 * Math.log2(opts.release_scale);
        p.release_vol_env += tc;
        p.release_mod_env += tc;
    }
    // ソフトペル: カットオフを下げる(音量は下の base に掛ける)
    if( opts.soft ) p.init_filter_Fc = Math.max(1500, p.init_filter_Fc + SOFT_CUTOFF);

    return p;
}
