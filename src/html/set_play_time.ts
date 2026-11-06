import manager from '../web_audio/manager.ts'

const elem = document.getElementById('play_time') as HTMLInputElement;

const animate = () => {
    const player = manager.player;
    if( player && player.events[player.index] ){
	const time = manager.context.currentTime + player.time_offset;
	elem.value = (Math.round(100*time)/100).toString();
    }
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
