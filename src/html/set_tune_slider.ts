import calc_time from '../web_audio/calc_time.ts'
import manager from '../web_audio/manager.ts'

const slider = document.getElementById('tune_slider') as HTMLInputElement;
let dragging = false;
slider.addEventListener('pointerdown', () => { dragging = true; });
window.addEventListener('pointerup', () => { dragging = false; });

setInterval(()=>{
    const player = manager.player;
    if( player && player.events[player.index] && !dragging ){
        const time = manager.context.currentTime + player.time_offset;
        slider.value = (Math.round(100*time)/100/player.duration).toString();
    }
}, 100);

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
