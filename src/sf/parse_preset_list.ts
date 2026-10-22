import type { PresetInfo } from './types.ts'
import type { RiffChunk } from '../read_riff.ts'
import { getString, getWord, getDword } from './get_xxx.ts'

const PHDR_SIZE = 38;

export default function parse_preset_list(phdr: RiffChunk) : PresetInfo[] {
    const rec = phdr.data;
    if( rec.length < PHDR_SIZE || rec.length % PHDR_SIZE !== 0 )
        throw new Error(`phdrチャンクのサイズが不正です: ${rec.length}`);

    const list = [];
    // 最後の1レコードは終端(EOP)。その開始位置が最後のプリセットの終端になる
    for( let i=0; i<rec.length-PHDR_SIZE; i+=PHDR_SIZE ){
        list.push({
            name:       getString(rec, i, i+20),
            MIDInumber: getWord(rec, i+20),
            bank:       getWord(rec, i+22),
            bag_start:  getWord(rec, i+24),
            bag_end:    getWord(rec, i+PHDR_SIZE+24), // 次のレコードの開始位置
            library:    getDword(rec, i+26),
            genre:      getDword(rec, i+30),
            morphology: getDword(rec, i+34),
        });
    }
    return list;
}
