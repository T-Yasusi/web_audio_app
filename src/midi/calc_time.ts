export default (tick, midi_json) => {
    const tempos = midi_json.tempos;
//    console.log(tempos);
//    console.log(midi_json);
    let time = 0;
    let tmp_tick = 0;
    for( let i = 0; i<tempos.length; i++ ){
        const next_tick = i < tempos.length-1 ? tempos[i+1].tick : Number.MAX_SAFE_INTEGER;
        if( tick < next_tick ){
            time += (tick-tmp_tick)*tempos[i].data/midi_json.division;
            tmp_tick = tick;
            break;
        }
        else{
            time += (tempos[i].tick-tmp_tick)*tempos[i].data/midi_json.division;
            tmp_tick = tempos[i].tick;
        }
    }
    return time/10**6;
}
