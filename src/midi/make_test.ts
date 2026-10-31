// テスト用 MIDI を TS で作る。パース済みの MidiInfo を組み立てて、本番と同じ post_parse に通す
import type { MidiInfo, MidiFile, Event } from './types.ts'
import build_song from './build_song.ts'

const D = 480;   // 四分音符 = 480 tick。beat(n) で拍を tick に変換する
const beat = (n: number) => Math.round(n * D);

const on   = (b: number, ch: number, note: number, vel = 100): Event =>
    ({ event: 'midi', type: 'noteOn', tick: beat(b), channel: ch, data: [note, vel] });
const off  = (b: number, ch: number, note: number): Event =>
    ({ event: 'midi', type: 'noteOff', tick: beat(b), channel: ch, data: [note, 0] });
const cc   = (b: number, ch: number, num: number, value: number): Event =>
    ({ event: 'midi', type: 'controlChange', tick: beat(b), channel: ch, data: [num, value] });
// value: -8192〜8191(0 が中央)
const bend = (b: number, ch: number, value: number): Event => {
    const v = value + 8192;
    return { event: 'midi', type: 'pitchBend', tick: beat(b), channel: ch, data: [v & 0x7f, v >> 7] };
};
const note = (b: number, len: number, ch: number, n: number, vel = 100): Event[] =>
    [on(b, ch, n, vel), off(b + len, ch, n)];

// 1トラックのフォーマット0として組み立てる。tick 順に並べておく(パーサの出力と同じ)
function build(events: Event[]): MidiFile {
    events.sort((a, b) => a.tick - b.tick);
    const info: MidiInfo = { format: 0, ntrack: 1, division: D, tracks: [events] };
    return build_song(info);
}

// CC1: 長い音の途中でモジュレーションホイールを上げ下げする(ビブラート)
function mod_wheel() {
    return build([
        ...note(0, 10, 0, 60),
        cc(2, 0, 1, 40), cc(4, 0, 1, 127), cc(6, 0, 1, 0),   // 弱 → 強 → なし
        ...note(10, 3, 0, 64), cc(10, 0, 1, 127), cc(12, 0, 121, 0),   // CC121 でホイールが戻る
    ]);
}

// チャンネルプレッシャー(ビブラート)
function pressure() {
    const p = (b: number, v: number): Event => ({ event: 'midi', type: 'channelPressure', tick: beat(b), channel: 0, data: v });
    return build([ ...note(0, 8, 0, 60), p(2, 40), p(4, 127), p(6, 0) ]);
}

// 排他クラス: ドラム(ch10)のハイハット 42=クローズ 44=ペダル 46=オープン
function hihat() {
    return build([
        ...note(0, 0.5, 9, 42), ...note(1, 0.5, 9, 42),                 // クローズ(基準)
        ...note(2, 2, 9, 46), ...note(3, 0.25, 9, 42),                  // オープンの余韻を、クローズが切る
        ...note(5, 2, 9, 46), ...note(6, 0.25, 9, 44),                  // オープンの余韻を、ペダルが切る
        ...note(8, 2, 9, 46),                                           // 比較用: 切らずに鳴らし切る
    ]);
}

// ダンパーペダル(CC64)とハーフペダル
function pedal() {
    return build([
        cc(0, 0, 64, 127), ...note(0, 0.5, 0, 60), ...note(1, 0.5, 0, 64), ...note(2, 0.5, 0, 67), cc(3, 0, 64, 0),   // 踏んだ間は鳴り続ける
        cc(4, 0, 64, 32), ...note(4, 0.5, 0, 60), ...note(5, 0.5, 0, 64), cc(6, 0, 64, 0),                           // ハーフペダル(リリースが長め)
        ...note(8, 0.5, 0, 60), ...note(9, 0.5, 0, 64),                                                              // ペダルなしの比較
    ]);
}

// ピッチベンド: 既定の幅(±2半音)と、RPN で ±12 に広げた幅
function pitch_bend() {
    const rpn = (b: number, range: number) =>
        [cc(b, 0, 101, 0), cc(b, 0, 100, 0), cc(b, 0, 6, range), cc(b, 0, 101, 127), cc(b, 0, 100, 127)];
    return build([
        ...note(0, 4, 0, 60), bend(1, 0, 8191), bend(2, 0, -8192), bend(3, 0, 0),         // ±2 半音
        ...rpn(4, 12),
        ...note(5, 4, 0, 60), bend(6, 0, 8191), bend(7, 0, -8192), bend(8, 0, 0),         // ±12 半音
    ]);
}

// 音量(CC7)と、エクスプレッション(CC11)
function volume() {
    return build([
        ...note(0, 8, 0, 60),
        cc(2, 0, 7, 40), cc(4, 0, 7, 100),            // CC7 で小さく → 戻す
        cc(5, 0, 11, 40), cc(7, 0, 11, 127),          // CC11 で小さく → 戻す
    ]);
}

// RPN 1(ファインチューニング)と RPN 2(コースチューニング)
function tuning() {
    // RPN を選び、データを送り、選択を解除(127/127)する。fine のときは LSB(CC38)も送る
    const rpn = (b: number, lsb: number, msb_val: number, lsb_val?: number) => [
        cc(b, 0, 101, 0), cc(b, 0, 100, lsb), cc(b, 0, 6, msb_val),
        ...(lsb_val === undefined ? [] : [cc(b, 0, 38, lsb_val)]),
        cc(b, 0, 101, 127), cc(b, 0, 100, 127),
    ];
    return build([
        ...note(0, 1, 0, 60),                                                      // 基準(C4)
        ...rpn(1.5, 2, 76), ...note(2, 1, 0, 60),                                  // コース +12(1オクターブ上)
        ...rpn(3.5, 2, 52), ...note(4, 1, 0, 60),                                  // コース -12(1オクターブ下)
        ...rpn(5.5, 2, 64), ...note(6, 1, 0, 60),                                  // コース 0 に戻す(基準と同じ高さ)
        ...rpn(7.5, 1, 32, 0), ...note(8, 1, 0, 60),                               // ファイン -50 セント(1/4 音下)
        ...rpn(9.5, 1, 96, 0), ...note(10, 1, 0, 60),                              // ファイン +50 セント(1/4 音上)
        ...rpn(11.5, 1, 64, 0), ...note(12, 1, 0, 60),                             // ファイン 0 に戻す
        ...note(14, 6, 0, 60), ...rpn(15, 2, 70), ...rpn(17, 2, 64),               // 鳴っている途中で +6 半音 → 戻す
    ]);
}

// SysEx のリセット(GM / GS / XG)。リセット前は「変な状態」、リセット後は初期状態になる
function sysex_reset() {
    const sysex = (b: number, bytes: number[]): Event =>
        ({ event: 'SysEx', type: '240', tick: beat(b), data: Uint8Array.from(bytes) });   // type '240' = F0。data は F0 を除き、F7 を含む
    const rpn = (b: number, lsb: number, value: number) =>
        [cc(b, 0, 101, 0), cc(b, 0, 100, lsb), cc(b, 0, 6, value), cc(b, 0, 101, 127), cc(b, 0, 100, 127)];

    // 変な状態: 小音量、左いっぱい、ビブラート最大、ベンド幅 ±12、+12 半音
    const messy = (b: number) => [
        cc(b, 0, 7, 40), cc(b, 0, 10, 0), cc(b, 0, 11, 60), cc(b, 0, 1, 127),
        ...rpn(b, 0, 12), ...rpn(b, 2, 76),
    ];
    // 1ブロック = 6拍。変な状態で鳴らす → リセットを送る → 同じ操作で鳴らす
    const block = (b: number, reset: number[]) => [
        ...messy(b),
        ...note(b + 0.5, 2, 0, 60), bend(b + 1, 0, 8191),   // 変な状態: 小さく、左から、揺れて、1オクターブ上、ベンドは +12 半音
        sysex(b + 3, reset),
        ...note(b + 3.5, 2, 0, 60), bend(b + 4, 0, 8191),   // 初期状態: 普通の音量、中央、揺れなし、基準の高さ、ベンドは +2 半音
    ];

    return build([
        ...note(0, 1.5, 0, 60),                                                                  // 基準(初期状態)
        ...block(2,  [0x7e, 0x7f, 0x09, 0x01, 0xf7]),                                            // GM System On
        ...block(8,  [0x41, 0x10, 0x42, 0x12, 0x40, 0x00, 0x7f, 0x00, 0x41, 0xf7]),              // GS Reset
        ...block(14, [0x43, 0x10, 0x4c, 0x00, 0x00, 0x7e, 0x00, 0xf7]),                          // XG System On
        ...block(20, [0x41, 0x10, 0x42, 0x12, 0x40, 0x01, 0x30, 0x00, 0x4f, 0xf7]),              // 対照: リセットではない GS のパラメータ設定。戻らなければ正しい
    ]);
}

export const test_songs: { name: string; make: () => MidiFile }[] = [
    { name: 'TEST: mod wheel (CC1)', make: mod_wheel },
    { name: 'TEST: channel pressure', make: pressure },
    { name: 'TEST: hi-hat exclusive', make: hihat },
    { name: 'TEST: damper pedal', make: pedal },
    { name: 'TEST: pitch bend / RPN', make: pitch_bend },
    { name: 'TEST: volume / expression', make: volume },
    { name: 'TEST: tuning (RPN 1/2)', make: tuning },
    { name: 'TEST: SysEx reset (GM/GS/XG)', make: sysex_reset },
];
