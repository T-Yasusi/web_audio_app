export default function readVLQ(view: DataView, offset: number) {
    let value = 0;
    for( let i = 0; i < 4; i++ ){
        const byte = view.getUint8(offset++);
        value = (value << 7) | (byte & 0x7f);
        if( (byte & 0x80) === 0 ) return { value, offset };
    }
    throw new Error('可変長数値が4バイトを超えています');
}
