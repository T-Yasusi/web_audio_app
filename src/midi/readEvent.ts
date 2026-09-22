import readVLQ from './readVLQ.ts'

export default (view: DataView, offset: number) => {
    const obj = {};    
    const byte = view.getUint8(offset++);
    
    if( byte === 0xff ) return parse_meta_event(view, offset, obj);
    else if( byte && 0x80 ) return parse_midi_event(view, byte, offset, obj)
    else if( byte === 0xf0 || byte == 0xf7 ){
	obj.event = "SysEx";
	obj.type = byte;
        const result = readVLQ(view, pos);
	obj.data = new Uint8Array(view.buffer, view.byteOffset+offset, result.value);
	offset = result.offset+result.value;
	return { obj, offset };
    }    
    else{
	console.log('running status');
	throw new Error('tmp');
    }    
}

function parse_midi_event(view: DataView, byte: number, offset: number, obj: object){
    obj.event = 'midi';
    const type = (byte >> 4) & 0xf
    obj.channel = byte & 0xf
//    console.log(byte.toString(16), type, obj.channel);
    if( type === 0xC || type === 0xD ){
	obj.data = [ view.getUint8(offset) ];
	offset += 1;
    }
    else{
	obj.data = [ view.getUint8(offset), view.getUint8(offset+1) ];
	offset += 2;
    }
    if ( type === 0x8 ){
	obj.type = "noteOff";
    }
    else if( type === 0x9 ) obj.type ="noteOn";
    else if( type === 0xA ) obj.type ="keyPressure";
    else if( type === 0xB ) obj.type ="controlChange";
    else if( type === 0xC ) obj.type ="programChange";
    else if( type === 0xD ) obj.type ="channelPressure";
    else if( type === 0xE ) obj.type ="pitchBend";
    else throw new Error('MIDI:Midiイベント 不明なタイプです');

    return { obj, offset }
}

function parse_meta_event(view: DataView, offset: number, obj: object){
    obj.event = 'Meta';
    obj.id = view.getUint8(offset++);
    if( obj.id === 0x00 ) obj.type = "Sequence Number"
    else if ( obj.id === 0x01 ) obj.type = "Text Event"
    else if ( obj.id === 0x02 ) obj.type = "Copyright Notice"
    else if ( obj.id === 0x03 ) obj.type = "Track Name"
    else if ( obj.id === 0x04 ) obj.type = "Instrument Name"
    else if ( obj.id === 0x05 ) obj.type = "Lyric"
    else if ( obj.id === 0x06 ) obj.type = "Marker"
    else if ( obj.id === 0x07 ) obj.type = "Cue Point"
    else if ( obj.id === 0x08 ) obj.type = "Program Name"
    else if ( obj.id === 0x09 ) obj.type = "Device Name"
    else if ( obj.id === 0x20 ) obj.type = "MIDI Channel Prefix"
    else if ( obj.id === 0x21 ) obj.type = "MIDI Port"
    else if ( obj.id === 0x2f ) obj.type = "End of Track"
    else if ( obj.id === 0x51 ) obj.type = "Set Tempo"
    else if ( obj.id === 0x54 ) obj.type = "SMPTE Offset"
    else if ( obj.id === 0x58 ) obj.type = "Time Signature"
    else if ( obj.id === 0x59 ) obj.type = "Key Signature"
    else if ( obj.id === 0x7f ) obj.type = "Sequencer-Specific"
    else new Error('MIDI:Metaイベント 不明なタイプです');
    
    if( obj.id === 0x00 ){
	obj.data = view.getUint16(offset+1, false);
	offset += 3;
    }
    else if( obj.id === 0x20 || obj.id === 0x21 ){
	obj.data = view.getUint8(offset+1);
	offset += 2;
    }
    else if( obj.id === 0x2f ) offset +=1;
    else if( obj.id === 0x51 ){
	obj.data = 256*256*view.getUint8(offset+1) + 256*view.getUint8(offset+2) + view.getUint8(offset);
	offset += 4;
    }
    else if( obj.id === 0x54 ){
	obj.data = { hr: view.getUint8(offset+1),
		     mn: view.getUint8(offset+2),
		     se: view.getUint8(offset+3),
		     fr: view.getUint8(offset+4),
		     ff: view.getUint8(offset+5) }
	offset += 6;
    }
    else if( obj.id === 0x58 ){
	obj.data = { nn: view.getUint8(offset+1),
		     dd: view.getUint8(offset+2),
		     cc: view.getUint8(offset+3),
		     bb: view.getUint8(offset+4) }
	offset += 5;
    }
    else if( obj.id === 0x59 ){
	obj.data = { sf: view.getInt8(offset+1), minor: view.getUint8(offset+2) === 1 }
	offset += 3;
    }
    else {
	const result = readVLQ(view, offset);
	offset = result.offset
	obj.data = new TextDecoder().decode(new Uint8Array(view.buffer, view.byteOffset+offset, result.value));
	offset = result.offset+result.value;
    }
//    console.log('==== Meta Event =====');
//    console.log(obj);
    return { obj, offset }
}
