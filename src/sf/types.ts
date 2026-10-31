export type SFFile = {
    info: SFInfo;
    presets: Preset[];
}

export type SFInfo = Record<string, string | { major: number, minor: number }>;

export type Sample = {
    name: string;
    sample: Float32Array;
    loop_start: number;
    loop_end: number;
    sampling_rate: number;
    origin_pitch: number;
    correction: number;
    sample_link: number;
    sample_type: number;
}

export type Modulator = {
    mod_src_oper: number;
    gen_name: string;
    amount: number;
    mod_amt_src_oper: number;
    mod_trans_oper: number;
}

export type Instrument = {
    name: string;
    zones: InstZone[];
    global_zone?: InstZone;
}

export type Preset = {
    name: string;
    MIDInumber: number;
    bank: number;
    zones: PresetZone[];
    global_zone?: PresetZone;
    library: number;
    genre: number;
    morphology: number;
};

export type InstZone = {
    generators: Record<string, number | [ number, number ] | undefined>;
    modulators: Modulator[];
    sample?: Sample;
}

export type PresetZone = {
    generators: Record<string, number | [ number, number ] | undefined>;
    modulators: Modulator[];
    instrument?: Instrument;
}

