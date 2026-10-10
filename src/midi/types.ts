type MidiObj = Record<string, any>;
type Result = { obj: MidiObj; offset: number; status: number };

const MIDI_TYPES: Record<number, string> = {
    0x8: 'noteOff', 0x9: 'noteOn', 0xA: 'keyPressure', 0xB: 'controlChange',
    0xC: 'programChange', 0xD: 'channelPressure', 0xE: 'pitchBend',
};

const META_TYPES: Record<number, string> = {
    0x00: 'Sequence Number', 0x01: 'Text Event', 0x02: 'Copyright Notice', 0x03: 'Track Name',
    0x04: 'Instrument Name', 0x05: 'Lyric', 0x06: 'Marker', 0x07: 'Cue Point',
    0x08: 'Program Name', 0x09: 'Device Name', 0x20: 'MIDI Channel Prefix', 0x21: 'MIDI Port',
    0x2f: 'End of Track', 0x51: 'Set Tempo', 0x54: 'SMPTE Offset', 0x58: 'Time Signature',
    0x59: 'Key Signature', 0x7f: 'Sequencer-Specific',
};

// 長さが固定のメタイベント
const META_LENGTH: Record<number, number> = { 0x20: 1, 0x21: 1, 0x2f: 0, 0x51: 3, 0x54: 5, 0x58: 4, 0x59: 2 };
