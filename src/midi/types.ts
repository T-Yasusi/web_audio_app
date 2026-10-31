export type MidiInfo = {
    format: number;
    ntrack: number;
    division: number;
    tracks: Array<Array<Event>>;

}

export type MidiFile = {
    format: number;
    division: number;
    tempos: Event[];
    events: Event[];
    time_table: { ticks: number[], secs: number[], rates: number[] };
    duration: number;
}

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
