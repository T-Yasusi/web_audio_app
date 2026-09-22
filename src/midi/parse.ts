import readVLQ from './readVLQ.ts'
import readEvent from './readEvent.ts'

export default (buffer) => {
    if( buffer.subarray(0, 4).toString("ascii") !== 'MThd' ) throw new Error('MIDIファイルではありません')
    
    const data = new Uint8Array(buffer);
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    
    const format = view.getUint16(8, false);
    const ntrack = view.getUint16(10, false);
    const division = view.getUint16(12, false);

    if ( (division & 0x8000) !== 0 ) throw new Error('SMPTEモードはサポートしていません')
    const tracks = [];
    let pos = 14;
    
    for( let i = 0; i<ntrack; i++ ){
	if( buffer.subarray(pos, pos+4).toString('ascii') !== 'MTrk' ) throw new Error('不正なMIDIファイルです')
	const end = pos + 8 + view.getUint32(pos+4, false);
	pos +=8;
	let absoluteTick = 0;
//	console.log(pos, end, buffer.length);
	while( pos < end ){
	    const obj = readVLQ(view, pos);
	    pos = obj.offset;
	    absoluteTick += obj.value;
	    	    
	    const result = readEvent(view, pos);
	    const event = result.obj;
	    pos = result.offset;
	}
    }
    if( pos !== buffer.length ) throw new Error('ファイルサイズが一致しません');    
};

