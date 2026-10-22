const latin1 = new TextDecoder('latin1');

export function getString(array: Uint8Array, start: number, end: number){
    const bytes = array.subarray(start, end);
    const nul = bytes.indexOf(0);
    return latin1.decode(nul < 0 ? bytes : bytes.subarray(0, nul));  // 最初のNULまで
}

export function getDword(array: Uint8Array, i: number){ return array[i]+256*array[i+1]+256*256*array[i+2]+256*256*256*array[i+3]; }
export function getWord(array: Uint8Array, i: number){ return array[i]+256*array[i+1]; }
export function getChar(array: Uint8Array, i: number){ return (array[i] << 24) >> 24; }   // 符号付き8bit
// 符号付き16bit(リトルエンディアン)
export function getShort(array: Uint8Array, i: number){ return ((array[i] | (array[i+1] << 8)) << 16) >> 16; } 

export function getModulator(array: Uint8Array){
    return { mod_src_oper: getWord(array, 0),
             gen_name: getGeneratorName(getWord(array, 2)),
             amount: getShort(array, 4),
             mod_amt_src_oper: getWord(array, 6),
             mod_trans_oper: getWord(array, 8)
           };
};

export function getGenerator(array: Uint8Array): { name: string, data: number | [ number, number] } {
    let name=getGeneratorName(getWord(array, 0));
    if( !name ) throw new Error("SondfFont : Generator名が見つかりませんでした");
    if( name==="sample_id" || name==="instrument" ) return { name: name, data: getWord(array, 2) };
    if( name==="key_range" || name=="vel_range" ) return { name: name, data: [array[2], array[3]] };
    return { name: name, data: getShort(array, 2) };
};

const GENERATOR_NAMES = [
    "start_addrs_offset",   "end_addrs_offset",     "start_loop_addrs_offset",  "end_loop_addrs_offset", "start_addrs_coarse",
    "mod_lfo_to_pitch",     "vib_lfo_to_pitch",     "mod_env_to_pitch",         "init_filter_Fc",        "init_filter_Q",
    "mod_lfo_to_filter_Fc", "mod_env_to_filter_Fc", "end_addrs_coarse_offset",  "mod_lfo_to_volume",     "unused1",
    "chorus_effect_send",   "reverb_effect_send",   "pan",                      "unused2",               "unused3",
    "unused4",              "delay_mod_lfo",        "freq_mod_lfo",             "delay_vib_lfo",         "freq_vib_lfo",
    "delay_mod_env",        "attack_mod_env",       "hold_mod_env",             "decay_mod_env",         "sustain_mod_env",
    "release_mod_env",      "keynum_to_mod_env_hold", "keynum_to_mod_env_decay", "delay_vol_env",        "attack_vol_env",
    "hold_vol_env",         "decay_vol_env",        "sustain_vol_env",          "release_vol_env",       "keynum_to_vol_env_hold",
    "keynum_to_vol_env_decay", "instrument",        "reserved1",                "key_range",             "vel_range",
    "start_loop_addrs_coarse_offset", "keynum",     "velocity",                 "init_attenuation",      "reserved2",
    "end_loop_addrs_coarse_offset", "coarse_tune",  "fine_tune",                "sample_id",            "sample_modes",
    "reserved3",            "scale_tuning",         "exclusive_class",          "overriding_root_key",  "unused5",
    "end_oper" ];
function getGeneratorName(id: number){ return GENERATOR_NAMES[id]; }

