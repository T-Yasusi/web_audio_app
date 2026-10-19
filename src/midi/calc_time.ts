const tables = new WeakMap<object, { ticks: number[]; secs: number[]; rates: number[] }>();

// 各テンポ区間の「開始tick・開始秒・1tickあたりの秒」を作る
function build_table(midi_json: any) {
    const { tempos, division } = midi_json;
    const ticks: number[] = [], secs: number[] = [], rates: number[] = [];
    let sec = 0;

    for( let i = 0; i < tempos.length; i++ ){
        if( i > 0 ) sec += (tempos[i].tick - tempos[i-1].tick) * tempos[i-1].data / division / 1e6;
        ticks.push(tempos[i].tick);
        secs.push(sec);
        rates.push(tempos[i].data / division / 1e6);
    }
    return { ticks, secs, rates };
}

export default function calc_time(tick: number, midi_json: any) {
    let table = tables.get(midi_json);
    if( !table ){ table = build_table(midi_json); tables.set(midi_json, table); }
    const { ticks, secs, rates } = table;

    // tick 以下で最大の開始tick(= tick が属するテンポ区間)を二分探索
    let lo = 0, hi = ticks.length - 1;
    while( lo < hi ){
        const mid = (lo + hi + 1) >> 1;
        if( ticks[mid] <= tick ) lo = mid; else hi = mid - 1;
    }
    return secs[lo] + (tick - ticks[lo]) * rates[lo];
}

