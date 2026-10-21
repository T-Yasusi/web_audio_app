export type MidiEvent = {
    event: string;
    type: string;
    tick: number;
    channel: number;
    data: number | [ number, number ];
};

export type Note = {
    event: string;
    type: string;
    channel: number;
    midi_note: number;
    velocity: number;
    tick: number;
    endTick: number;
    off_tick?: number;
    release_scale?: number;
    soft?: boolean;    
};

export type MetaEvent = {
    event: string;
    type: string;
    tick: number;
    id: number;
    data: number |
        { hr: number, mn: number, se: number, fr: number, ff: number } |
        { nn: number, dd: number, cc: number, bb: number } |
        { sf: number, minor: boolean } |
        Uint8Array |
        string | undefined
};

export type SysExEvent = {
    event: string;
    type: string;
    tick: number;
    data: Uint8Array;
}

export type Event = MidiEvent | MetaEvent | SysExEvent | Note;
