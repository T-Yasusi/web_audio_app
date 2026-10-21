import type { Event, Note, MidiEvent } from './types.ts'

const ON = 64;                // これ以上でペダルがオン
const HALF_PEDAL_RELEASE = 6; // ハーフペダルが63のときの、リリースの最大倍率(近似)

// events: パース直後の全イベント。notes: ノートオブジェクトの配列(その場で書き換える)
export default function adjust_note_ends(events: Event[], notes: Event[]) {
    const last_tick = events.reduce((m, e) => Math.max(m, e.tick), 0);
    const controls = events.filter(e => e.type === 'controlChange').sort((a, b) => a.tick - b.tick);

    const damper = pedal_intervals(controls, 64, last_tick);
    const sostenuto = pedal_intervals(controls, 66, last_tick);
    const soft = pedal_intervals(controls, 67, last_tick);
    const damper_values = pedal_values(controls, 64);
    const note_off = ticks_of(controls, 123);
    const sound_off = ticks_of(controls, 120);

    for( const note of notes ){
        if( note.type !== 'note' ) continue;
        const ch = (note as Note).channel;
        (note as Note).off_tick = (note as Note).endTick;   // 鍵を離した位置(元の値)

        cut(note as Note, note_off[ch]);        // CC123: 鍵が押されているノートを離す

        // CC64(ダンパー)と CC66(ソステヌート)による延長。連鎖するので、変わらなくなるまで繰り返す
        for(;;){
            let end = (note as Note).endTick;
            const d = in_interval(damper[ch], end);
            if( d ) end = Math.max(end, d[1]);
            for( const [down, up] of sostenuto[ch] )
                if( note.tick <= down && down < end ) end = Math.max(end, up);   // 踏んだ時点で鳴っていたノートだけ
            if( end === (note as Note).endTick ) break;
            (note as Note).endTick = end;
        }

        const before = (note as Note).endTick;
        cut(note as Note, sound_off[ch]);       // CC120: 全音停止はペダルでも止まらない
        if( (note as Note).endTick === before ){
            // ハーフペダル: 離す瞬間のペダル値が 1〜63 なら、リリースを長くする
            const v = value_at(damper_values[ch], (note as Note).endTick);
            if( v > 0 && v < ON ) (note as Note).release_scale = 1 + (v / ON) * (HALF_PEDAL_RELEASE - 1);
        }
        // CC67: 鳴らし始めの時点でソフトペダルが踏まれていたノート
        if( in_interval(soft[ch], note.tick) ) (note as Note).soft = true;
    }
}

// チャンネルごとの、ペダル cc がオンの区間 [踏む, 離す)。CC121(リセット)でも戻る
function pedal_intervals(controls: Event[], cc: number, last_tick: number) {
    const result: [number, number][][] = Array.from({ length: 16 }, () => []);
    const down_at: (number | null)[] = new Array(16).fill(null);
    for( const e of controls ){
        const ch = (e as MidiEvent).channel, [num, value] = (e as MidiEvent).data as [ number, number];
        if( num !== cc && num !== 121 ) continue;
        const on = num === cc && value >= ON;
        if( on && down_at[ch] === null ) down_at[ch] = e.tick;
        else if( !on && down_at[ch] !== null ){
            result[ch].push([down_at[ch]!, e.tick]);
            down_at[ch] = null;
        }
    }
    // 離されないまま曲が終わったペダルは、曲の終わりまで
    for( let ch = 0; ch < 16; ch++ )
        if( down_at[ch] !== null ) result[ch].push([down_at[ch]!, last_tick]);
    return result;
}

// チャンネルごとの、ペダル cc の [tick, 値] の列。CC121 は値0
function pedal_values(controls: Event[], cc: number) {
    const result: [number, number][][] = Array.from({ length: 16 }, () => []);
    for( const e of controls ){
        const [num, value] = (e as MidiEvent).data as [number, number];
        if( num === cc ) result[(e as MidiEvent).channel].push([e.tick, value]);
        else if( num === 121 ) result[(e as MidiEvent).channel].push([e.tick, 0]);
    }
    return result;
}

const ticks_of = (controls: Event[], cc: number) => {
    const r: number[][] = Array.from({ length: 16 }, () => []);
    for( const e of controls ) if( (e as MidiEvent).data as [ number, number][0] === cc ) r[(e as MidiEvent).channel].push(e.tick);
    return r;
};

// ノートの鳴っている間(開始より後、終了より前)の tick で、終了を縮める
const cut = (note: Note, ticks: number[]) => {
    for( const t of ticks ) if( note.tick < t && t < note.endTick ) note.endTick = t;
};

// 先頭の要素(tick)が tick 以下の、最後の要素の添字(なければ -1)。arr は tick 順
function last_index(arr: [number, number][], tick: number) {
    let lo = 0, hi = arr.length - 1, found = -1;
    while( lo <= hi ){
        const mid = (lo + hi) >> 1;
        if( arr[mid][0] <= tick ){ found = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return found;
}
function in_interval(intervals: [number, number][], tick: number) {
    const i = last_index(intervals, tick);
    return i >= 0 && tick < intervals[i][1] ? intervals[i] : null;
}
function value_at(values: [number, number][], tick: number) {
    const i = last_index(values, tick);
    return i >= 0 ? values[i][1] : 0;
}
