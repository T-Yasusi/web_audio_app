import readVLQ from './readVLQ.ts'
import readEvent from './readEvent.ts'

export default (buffer: Uint8Array) => {
    if( new TextDecoder().decode(buffer.subarray(0, 4)) !== 'MThd' ) throw new Error('MIDIファイルではありません')    
    const data = new Uint8Array(buffer);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    const format = view.getUint16(8, false);
    const ntrack = view.getUint16(10, false);
    const division = view.getUint16(12, false);
    const result = { format, ntrack, division }

    if ( (division & 0x8000) !== 0 ) throw new Error('SMPTEモードはサポートしていません')
    const tracks = [];
    let pos = 14;
    
    for( let i = 0; i<ntrack; i++ ){
	if( new TextDecoder().decode(buffer.subarray(pos, pos+4)) !== 'MTrk' ) throw new Error('不正なMIDIファイルです')
	const track = [];
	
	const end = pos + 8 + view.getUint32(pos+4, false);
	pos +=8;
	let absoluteTick = 0;
//	console.log(pos, end, buffer.length);
	while( pos < end ){
	    const obj = readVLQ(view, pos);
	    pos = obj.offset;
	    absoluteTick += obj.value;
	    	    
	    const result = readEvent(view, pos, absoluteTick);
	    track.push(result.obj);
	    pos = result.offset;	    
	}
	tracks.push(track);
    }
    if( pos !== buffer.length ) throw new Error('ファイルサイズが一致しません');
    
    result.tracks = tracks;
    return result;
};

