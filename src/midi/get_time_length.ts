import calc_time from './calc_time.ts'

export default (midi_json: any) => {
    let max_time = 0;
    for( const track of midi_json.tracks ){
        for( const event of track ){
            if( event.type === 'note' ){
                const stop_time = calc_time(event.endTick, midi_json);
                if( stop_time > max_time ) max_time = stop_time;
//                nNote ++;
            }
        }
    }
    return max_time;
}

