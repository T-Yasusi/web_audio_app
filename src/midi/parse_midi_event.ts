import type { MidiEvent } from './types.ts'

const MIDI_TYPES: Record<number, string> = {
    0x8: 'noteOff', 0x9: 'noteOn', 0xA: 'keyPressure', 0xB: 'controlChange',
    0xC: 'programChange', 0xD: 'channelPressure', 0xE: 'pitchBend',
};

// export type MidiEvent = {
//     event: string;
//     type: string;
//     tick: number;
//     channel: number;
//     data: number | [ number, number ];
// };

export default function parse_midi_event(view: DataView, status: number, offset: number, tick: number) {
    const type = status >> 4;

    let data;
    if( type === 0xC || type === 0xD ){
        data = view.getUint8(offset);
        offset += 1;
    }
    else{
        data = [ view.getUint8(offset), view.getUint8(offset+1) ] as [ number, number ];
        offset += 2;
    }
    const event : MidiEvent = { event: 'midi', type: MIDI_TYPES[type], tick: tick, channel: status & 0xf, data: data };
    return { obj: event, offset };
}
