export function getString(array, start, end){ return String.fromCharCode.apply("", array.subarray(start, end)).replace(/\x00+$/, ''); }
export function getDword(array, i){ return array[i]+256*array[i+1]+256*256*array[i+2]+256*256*256*array[i+3]; }
export function getWord(array, i){ return array[i]+256*array[i+1]; }
export function getChar(array, i){ return array[i]; }
export function getShort(array, i){ new Int16Array(array.subarray(i, i+1).buffer)[0]; }
export function getModulator(array){
    return { mod_src_oper: getWord(array, 0),
             gen_name: getGeneratorName(getWord(array, 2)),
             mount: getShort(array, 4),
             mod_amt_src_oper: getWord(array, 6),
             mod_trans_oper: getWord(array, 8)
           };                                                                                                  
};

export function getGenerator(array){
    let name=getGeneratorName(getWord(array, 0));
    if( !name ) throw new Error("tmp exception");
    if( name==="sample_id" || name==="instrument" ) return { name: name, data: getWord(array, 2) };
    if( name==="key_range" || name=="vel_range" ) return { name: name, data: [array[2], array[3]] };
    return { name: name, data: getShort(array, 2) };
};
function getGeneratorName(id){
    let name_list=[
        "start_addrs_offset",   "end_addrs_offset",      "start_loop_addrs_offset", "end_loop_addrs_offset", "start_addrs_coarse",
        "mod_flo_to_pitch",     "viv_flo_to_pitch",     "vib_env_to_pitch",         "init_filter_Fc",        "init_filter_Q",
        "mod_flo_to_filter_Fc", "mod_env_to_filter_Fc", "end_addrs_coarse_offset",  "mod_flo_to_volume",     "unused1",
        "chouse_effect_send",   "reverb_effect_send",   "pan",                      "unused2",               "unused3",
        "unused4",              "decay_mod_flo",        "freq_mod_flo",             "delay_vib_flo",         "freq_viv_flo",
        "delay_mod_env",        "attack_mod_env",       "hold_mod_env",             "decay_mod_env",         "sustain_mod_env",
        "release_mod_env",      "keynum_to_mod_env_hold", "keynum_to_mod_env_decay", "delay_vol_env",        "attack_vol_env",
        "hold_vol_env",         "decay_vol_env",        "sustain_vol_env",          "release_vol_env",       "keynum_to_vol_env_hold",
        "keynum_to_vol_env_decay", "instrument",        "reserved1",                "key_range",             "vel_range",
        "start_loop_addrs_coarse_offset", "keynum",     "velocity",                 "init_attenuation",      "reserved2",
        "end_loop_addrs_coarse_offset", "coarse_tune",  "fine_tune",                "sample_id",            "sample_modes",
        "reserved3",            "scale_tuning",         "exclusive_class",          "overriding_root_key",  "unused5",
        "end_oper" ];
    return name_list[id];
};
