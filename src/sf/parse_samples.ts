import type { Sample } from './types.ts'
import type { RiffChunk, RiffList } from './read_riff.ts'
import { getString, getDword, getWord, getChar } from './get_xxx.ts'

const SHDR_SIZE = 46;

export default function parse_samples(shdr: RiffChunk, sdta: RiffList) : Sample[] {
    const rec = (shdr as RiffChunk).data;
    if( rec.length % SHDR_SIZE !== 0 ) throw new Error(`shdrチャンクのサイズが不正です: ${rec.length}`);

    const smpl = sdta.children.find((c): c is RiffChunk => c.id === 'smpl');
    if( !smpl ) throw new Error('sdtaチャンクにsmplがありません');
    let sm24 = sdta.children.find((c): c is RiffChunk => c.id === 'sm24');
//    sm24 は1サンプル1バイト。足りなければ無視して16bitとして扱う
//    if( sm24 && sm24.data.length < smpl.data.length / 2 ) sm24 = null;

    const view = new DataView(smpl.data.buffer, smpl.data.byteOffset, smpl.data.byteLength);

    const samples = [];
    // 最後の1レコードは終端(EOS)なので読まない
    for( let i=0; i<rec.length-SHDR_SIZE; i+=SHDR_SIZE ){
        const name = getString(rec, i, i+20);
        const start = getDword(rec, i+20);
        const end = getDword(rec, i+24);
        if( start > end || 2*end > smpl.data.length )
            throw new Error(`サンプル範囲が不正です: ${name} (${start}, ${end})`);

        samples.push({
            name,
            sample: decode_samples(view, start, end, sm24),
            loop_start: getDword(rec, i+28) - start,
            loop_end: getDword(rec, i+32) - start,
            sampling_rate: getDword(rec, i+36),
            origin_pitch: rec[i+40],
            correction: getChar(rec, i+41),
            sample_link: getWord(rec, i+42),
            sample_type: getWord(rec, i+44),
        });
    }
    return samples;
}

function decode_samples(view: DataView, start: number, end: number, sm24?: RiffChunk){
    const n = end - start;
    const out = new Float32Array(n);
    if( sm24 ){
        for( let k=0; k<n; k++ ){
            const hi = view.getInt16(2*(start+k), true);  // 上位16bit(符号付き)
            const lo = sm24.data[start+k];                 // 下位8bit(符号なし)
            out[k] = (hi*256 + lo) / 8388608;              // 2^23
        }
    }
    else for( let k=0; k<n; k++ ) out[k] = view.getInt16(2*(start+k), true) / 32768;
    return out;
}
