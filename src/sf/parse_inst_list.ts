import type { RiffChunk } from '../read_riff.ts'
import { getString, getWord } from './get_xxx.ts'

const INST_SIZE = 22; // achInstName[20] + wInstBagNdx

export default function parse_inst_list(inst: RiffChunk) {
    const rec = inst.data;
    if( rec.length < INST_SIZE || rec.length % INST_SIZE !== 0 )
        throw new Error(`instチャンクのサイズが不正です: ${rec.length}`);

    const list = [];
    // 最後の1レコードは終端(EOI)。読み出しはしないが、その開始位置が最後の楽器の終端になる
    for( let i=0; i<rec.length-INST_SIZE; i+=INST_SIZE ){
        list.push({
            name: getString(rec, i, i+20),
            bag_start: getWord(rec, i+20),
            bag_end: getWord(rec, i+INST_SIZE+20), // 次のレコードの開始位置
        });
    }
    return list;
}
