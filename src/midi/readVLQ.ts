export default (view: DataView, offset: number) => {
    let value = 0;
//    console.log(offset);
    while (true) {
        const byte = view.getUint8(offset++);
        value = (value << 7) | (byte & 0x7f);

        if ( (byte & 0x80) === 0 ) break;
    }

    return {
        value,
        offset,
    };
}
