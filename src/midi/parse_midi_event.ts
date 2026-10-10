const MIDI_TYPES: Record<number, string> = {
    0x8: 'noteOff', 0x9: 'noteOn', 0xA: 'keyPressure', 0xB: 'controlChange',
    0xC: 'programChange', 0xD: 'channelPressure', 0xE: 'pitchBend',
};

export default function parse_midi_event(view: DataView, status: number, offset: number, obj: MidiObj) {
    const type = status >> 4;
    obj.event = 'midi';
    obj.type = MIDI_TYPES[type];
    obj.channel = status & 0xf;

    if( type === 0xC || type === 0xD ){
        obj.data = view.getUint8(offset);
        offset += 1;
    }
    else{
        obj.data = [ view.getUint8(offset), view.getUint8(offset+1) ];
        offset += 2;
    }
    return { obj, offset };
}
