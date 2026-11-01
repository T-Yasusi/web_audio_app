import type { Modulator, InstZone, Instrument, PresetZone, Preset } from '../../sf/types.ts'

// ---- ソース(sfModSrcOper / sfModAmtSrcOper)の分解 ----------------------------------
// ビット 0〜6: インデックス / 7: CC フラグ / 8: 方向(1=負) / 9: 極性(1=バイポーラ) / 10〜15: カーブ
export type Source = { index: number; cc: boolean; negative: boolean; bipolar: boolean; type: number };

export function parse_source(word: number): Source {
    return {
        index: word & 0x7f,
        cc: (word & 0x80) !== 0,
        negative: (word & 0x100) !== 0,
        bipolar: (word & 0x200) !== 0,
        type: word >> 10,
    };
}

// カーブ: 0=線形 1=凹 2=凸 3=スイッチ
const SPAN = 40 / 96;   // 96dB の範囲で 20log の 2 乗 → 係数 40/96
const CURVES: ((x: number) => number)[] = [
    x => x,
    x => x <= 0 ? 0 : x >= 1 ? 1 : Math.min(1, -SPAN * Math.log10(1 - x)),    // 凹
    x => x <= 0 ? 0 : x >= 1 ? 1 : Math.max(0, 1 + SPAN * Math.log10(x)),     // 凸
    x => x >= 0.5 ? 1 : 0,                                                    // スイッチ
];

// 0〜1 に正規化した入力 x に、方向・極性・カーブを適用する。未知のカーブは NaN(そのモジュレータは無視)
export function curve_value(x: number, s: Source): number {
    const f = CURVES[s.type];
    if( !f ) return NaN;
    if( s.negative ) x = 1 - x;
    if( !s.bipolar ) return f(x);
    if( s.type === 3 ) return x >= 0.5 ? 1 : -1;
    const t = 2 * x - 1;                      // -1〜1
    return Math.sign(t) * f(Math.abs(t));     // 原点について対称
}

// ---- 静的に決まるソース(ノートオンの時点で値が確定するもの) -----------------------------
const GC_NONE = 0, GC_VELOCITY = 2, GC_KEY = 3;

// 値が決まらない(CC、ピッチベンドなど動的なもの。リンクを含む)ソースは null
function static_value(s: Source, note: number, vel: number): number | null {
    if( s.cc ) return null;
    if( s.index === GC_NONE ) return 1;                      // ソースなし: 値は 1
    if( s.index === GC_VELOCITY ) return curve_value(vel / 127, s);
    if( s.index === GC_KEY ) return curve_value(note / 127, s);
    return null;
}

// ---- 既定モジュレータ(SF2 仕様 8.4.2) ------------------------------------------------
const mod = (src: number, gen: string, amount: number, amt_src = 0, trans = 0): Modulator =>
    ({ mod_src_oper: src, gen_name: gen, amount, mod_amt_src_oper: amt_src, mod_trans_oper: trans });

export const DEFAULT_MODULATORS: Modulator[] = [
    mod(0x0502, 'init_attenuation', 960),         // ベロシティ → 減衰量
    mod(0x0102, 'init_filter_Fc', -2400),         // ベロシティ → カットオフ
    mod(0x000d, 'vib_lfo_to_pitch', 50),          // チャンネルプレッシャー → ビブラート
    mod(0x0081, 'vib_lfo_to_pitch', 50),          // CC1 → ビブラート
    mod(0x0587, 'init_attenuation', 960),         // CC7 → 減衰量
    mod(0x028a, 'pan', 1000),                     // CC10 → パン
    mod(0x058b, 'init_attenuation', 960),         // CC11 → 減衰量
    mod(0x00db, 'reverb_effect_send', 200),       // CC91 → リバーブ送り
    mod(0x00dd, 'chorus_effect_send', 200),       // CC93 → コーラス送り
    mod(0x020e, 'fine_tune', 12700, 0x0010),      // ピッチベンド × ベンドレンジ → ピッチ
];

// ---- モジュレータの合成 --------------------------------------------------------------
// 同じモジュレータ(ソース、宛先、量のソース、変換が同じ)かどうかのキー
const key = (m: Modulator) => `${m.mod_src_oper}:${m.gen_name}:${m.mod_amt_src_oper}:${m.mod_trans_oper}`;

// base のうち、over に同じものがあれば置き換え、なければ追加する
function override(base: Modulator[], over: Modulator[] = []) {
    const map = new Map<string, Modulator>();
    for( const m of base ) map.set(key(m), m);
    for( const m of over ) map.set(key(m), m);
    return [...map.values()];
}

// ノートオンの時点で確定するモジュレータの出力を、宛先ごとに合計して返す(単位は宛先の生成子と同じ)
export function calc_static_mods(iz: InstZone, inst: Instrument, pz: PresetZone, preset: Preset,
                                 note: number, vel: number): Record<string, number> {
    // インストゥルメント: 既定 ← グローバルゾーン ← ゾーン の順に、同じものを置き換える
    const inst_mods = override(override(DEFAULT_MODULATORS, inst.global_zone?.modulators), iz.modulators);
    // プリセット: グローバルゾーン ← ゾーン。インストの結果には、置き換えではなく加算する
    const preset_mods = override(preset.global_zone?.modulators ?? [], pz.modulators);

    const sum: Record<string, number> = {};
    for( const m of [...inst_mods, ...preset_mods] ){
        if( !m.gen_name ) continue;        // gen_name が空: 別のモジュレータへのリンク(未対応)
        if( m.mod_trans_oper !== 0 && m.mod_trans_oper !== 2 ) continue; // 未知の変換は無視する

        const s = static_value(parse_source(m.mod_src_oper), note, vel);
        const a = static_value(parse_source(m.mod_amt_src_oper), note, vel);
        if( s === null || a === null || Number.isNaN(s) || Number.isNaN(a) ) continue;   // 動的なものは、ここでは扱わない

        let out = m.amount * s * a;
        if( m.mod_trans_oper === 2 ) out = Math.abs(out);
        sum[m.gen_name] = (sum[m.gen_name] ?? 0) + out;
    }
    return sum;
}
