import context from './context.ts'
import master_gain from './master_gain.ts'
import calc_time from './calc_time.ts'
import MIDIPlayer from './MIDIPlayer'

const LOOKAHEAD = 1.1;   // 先読みする秒数
const INTERVAL = 1000;   // タイマーの間隔(ms)。先読みより短くする
const LEAD = 0.05;

export default async function play_midi(midi_json: any, sf_json: any) {
    await context.resume();                         // 先に再開してから時刻を読む
    
    const player = new MIDIPlayer(context, master_gain, sf_json, midi_json);
    let index = 0;
    let base_time = context.currentTime + LEAD;
   
    function scheduling() {
        const song_now = context.currentTime - base_time;   // 曲の何秒目か
        const horizon = song_now + LOOKAHEAD;
	
        while( index < player.events.length ){
            const event = player.events[index];
            const start = calc_time(event.tick, player);
            if( start >= horizon ) break;                    // ここから先は次回

	    player.apply_event(index);
            index++;
        }
        if( index >= player.events.length ) clearInterval(timer);
    }

    const timer = setInterval(scheduling, INTERVAL);
}
