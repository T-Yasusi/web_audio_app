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
};
const GEN_ENTRIES = Object.entries(GEN);

export default function calc_params(iz: any, inst: any, pz: any, preset: any, note: number) {
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
    
    return p;
}
