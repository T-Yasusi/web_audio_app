// import type { Note } from '../midi/types.ts'
import MIDIPlayer from '../web_audio/MIDIPlayer.ts' 
import calc_time from '../web_audio/calc_time.ts'
import manager from '../web_audio/manager.ts'

const slider = document.getElementById('tune_slider') as HTMLInputElement;

export default function set_tune_slider(player?: MIDIPlayer){
    if( !player ) return;
    if( !player.events[player.index] ) return;
    
    const time = calc_time(player.events[player.index].tick, player.time_table);
    
    slider.value = (time/player.duration).toString();
}

slider.addEventListener('change', ()=>{
    if( !manager.player ) return;
    const target_time = manager.player.duration*Number(slider.value);

    manager.player.time_offset = target_time - manager.player.context.currentTime;

    for( const [ i, event ] of Object.entries(manager.player.events) ){
	const time = calc_time(event.tick, manager.player.time_table);
	if( time >= target_time ){
	    manager.player.index = Number(i);
	    break;
	}
    }
});
