import type { Note } from '../midi/types.ts'
import MIDIPlayer from '../web_audio/MIDIPlayer.ts' 
import calc_time from '../web_audio/calc_time.ts'

const slider = document.getElementById('tune_slider') as HTMLInputElement;

export default function set_tune_slider(player: MIDIPlayer){
    let max = 0;
    for( const event of player.events ){
        const start = calc_time(event.tick, player.time_table);
        const end = (event as Note).endTick ? calc_time((event as Note).endTick, player.time_table) : 0;
        max = Math.max(start, end, max);
    }
    if( !player.events[player.index] ) return;
    
    const time = calc_time(player.events[player.index].tick, player.time_table);
    
    slider.value = (time/max).toString();
}

