export default function parse_sysex_event(view: DataView, byte: number, offset: number, obj: MidiObj) {
    const len = readVLQ(view, offset);
    const end = len.offset + len.value;
    if( end > view.byteLength ) throw new Error('MIDI: SysExの長さがファイルを超えています');
    obj.event = 'SysEx';
    obj.type = byte;
    obj.data = new Uint8Array(view.buffer, view.byteOffset + len.offset, len.value);
    return { obj, offset: end };
}
