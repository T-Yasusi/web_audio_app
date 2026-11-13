import manager from '../web_audio/manager.ts'

const elem = document.getElementById('play_time') as HTMLInputElement;

function animate(){
    const player = manager.player;
    if( player ){
        player.reverb.output.gain.value = Number((document.getElementById('reverb-wet') as HTMLInputElement).value);
        player.chorus.output.gain.value = Number((document.getElementById('chorus-wet') as HTMLInputElement).value);
        player.chorus.set_depth(Number((document.getElementById('chorus-depth') as HTMLInputElement).value));

	if( player && player.events[player.index] ){
            const time = manager.context.currentTime + player.time_offset;
            elem.value = (Math.round(100*time)/100).toString();
	}
    }
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
