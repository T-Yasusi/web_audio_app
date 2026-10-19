const STRING_FIELDS: Record<string, string> = {
    isng: 'sound_engine',
    INAM: 'name',
    irom: 'rom',
    ICRD: 'date',
    IENG: 'designer',
    IPRD: 'product',
    ICOP: 'copyright',
    ICMT: 'comment',
    ISFT: 'tool',
};

const decoder = new TextDecoder('latin1');

// ZSTR: 最初のNULまでが文字列。以降は偶数長に合わせる詰め物
function read_zstr(bytes: any) {
    const end = bytes.indexOf(0);
    return decoder.decode(end < 0 ? bytes : bytes.subarray(0, end));
}

const u16 = (b:any, o: any) => b[o] | (b[o + 1] << 8);

// ifil / iver 共通: wMajor, wMinor (各16bit リトルエンディアン)
function read_version(bytes: any, id: string) {
    if( bytes.length !== 4 ) throw new Error(`${id} チャンクのサイズが不正です: ${bytes.length}`);
    return { major: u16(bytes, 0), minor: u16(bytes, 2) };
}
		   
export default function parse_info(list: any) {
    const info = {} as Record<string, any>;
    for( const chunk of list.children ){
        if( chunk.id === 'ifil' ) info.sf_version = read_version(chunk.data, 'ifil');
        else if( chunk.id === 'iver' ) info.rom_version = read_version(chunk.data, 'iver');
        else if( STRING_FIELDS.hasOwnProperty(chunk.id) ){
	    info[STRING_FIELDS[chunk.id]] = read_zstr(chunk.data);
            // 未知のチャンクは無視する(RIFFの慣例)
	}
    }
    if( !info.sf_version ) throw new Error('INFOチャンクに必須のifilがありません');
    return info;
}
