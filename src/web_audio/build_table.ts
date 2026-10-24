import type { MidiFile, MetaEvent } from '../midi/types.ts'

export default function build_table(midi_json: MidiFile) {
    const { tempos, division } = midi_json;
    const ticks: number[] = [], secs: number[] = [], rates: number[] = [];
    let sec = 0;

    for( let i = 0; i < tempos.length; i++ ){
        const t1 = tempos[i] as MetaEvent;
        const t2 = tempos[i-1] as MetaEvent;
        if( i > 0 ) sec += (t1.tick - t2.tick) * (t2.data as number) / division / 1e6;
        ticks.push(t1.tick);
        secs.push(sec);
        rates.push((t1.data as number) / division / 1e6);
    }

    return { ticks, secs, rates };
}
