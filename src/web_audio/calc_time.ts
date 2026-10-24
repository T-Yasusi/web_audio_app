export default function calc_time(tick: number, time_table: { ticks: number[]; secs: number[]; rates: number[] }) {
    const { ticks, secs, rates } = time_table;

    // tick 以下で最大の開始tick(= tick が属するテンポ区間)を二分探索
    let lo = 0, hi = ticks.length - 1;
    while( lo < hi ){
        const mid = (lo + hi + 1) >> 1;
        if( ticks[mid] <= tick ) lo = mid; else hi = mid - 1;
    }
    return secs[lo] + (tick - ticks[lo]) * rates[lo];
}
