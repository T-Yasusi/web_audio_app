// テスト用 MIDI を TS で作る。パース済みの MidiInfo を組み立てて、本番と同じ post_parse に通す
import type { MidiInfo, MidiFile, Event } from './types.ts'
import post_parse from './post_parse.ts'

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
    return post_parse(info);
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

export const test_songs: { name: string; make: () => MidiFile }[] = [
    { name: 'TEST: mod wheel (CC1)', make: mod_wheel },
    { name: 'TEST: channel pressure', make: pressure },
    { name: 'TEST: hi-hat exclusive', make: hihat },
    { name: 'TEST: damper pedal', make: pedal },
    { name: 'TEST: pitch bend / RPN', make: pitch_bend },
    { name: 'TEST: volume / expression', make: volume },
];
