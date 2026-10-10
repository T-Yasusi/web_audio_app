import { getWord, getGenerator, getModulator } from './get_xxx.ts'

const BAG_SIZE = 4;   // wGenNdx, wModNdx
const GEN_SIZE = 4;   // sfGenOper, genAmount
const MOD_SIZE = 10;

// bag_start〜bag_end のゾーン列を読む。
// terminal: ゾーンの終端ジェネレータ名('sample_id' か 'instrument')。
// 戻り値の ref は、その終端ジェネレータの値(参照先の番号)。
export default function parse_zones(label, bag_start, bag_end, bag, mod, gen, terminal) {
    // 各テーブルの末尾は終端レコード。実データの個数はそれを除いたもの
    const n_bag = bag.data.length / BAG_SIZE - 1;
    const n_gen = gen.data.length / GEN_SIZE - 1;
    const n_mod = mod.data.length / MOD_SIZE - 1;
    if( bag_start > bag_end || bag_end > n_bag )
        throw new Error(`${label}: bagのインデックスが不正です`);

    const zones = [];
    let global_zone;
    for( let j=bag_start; j<bag_end; j++ ){
        const g_start = getWord(bag.data, BAG_SIZE*j);
        const m_start = getWord(bag.data, BAG_SIZE*j + 2);
        const g_end   = getWord(bag.data, BAG_SIZE*(j+1));
        const m_end   = getWord(bag.data, BAG_SIZE*(j+1) + 2);
        if( g_start > g_end || g_end > n_gen || m_start > m_end || m_end > n_mod )
            throw new Error(`${label}: gen/modのインデックスが不正です`);

        const zone = { generators: {}, modulators: [] };
        let ref;
        for( let k=g_start; k<g_end; k++ ){
            const g = getGenerator(gen.data.subarray(GEN_SIZE*k, GEN_SIZE*(k+1)));
            if( g.name === terminal ){ ref = g.data; break; }   // 終端。以降は無視
            if( Object.hasOwn(zone.generators, g.name) )
                throw new Error(`${label}: 同じGeneratorがあります: ${g.name}`);
            zone.generators[g.name] = g.data;
        }
        for( let k=m_start; k<m_end; k++ )
            zone.modulators.push(getModulator(mod.data.subarray(MOD_SIZE*k, MOD_SIZE*(k+1))));

        if( ref !== undefined ) zones.push({ zone, ref });
        else if( j === bag_start ) global_zone = zone;
        // 先頭以外で終端ジェネレータのないゾーンは、仕様どおり無視する
    }
    return { zones, global_zone };
}
