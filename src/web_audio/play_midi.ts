import type { MidiFile } from '../midi/types.ts'
import type { SFFile } from '../sf/types.ts'
import manager from './manager.ts'
import calc_time from './calc_time.ts'
import MIDIPlayer from './MIDIPlayer'
import set_tune_slider from '../html/set_tune_slider.ts'

const LOOKAHEAD = 1.1;   // 先読みする秒数
const INTERVAL = 1000;   // タイマーの間隔(ms)。先読みより短くする

export default async function play_midi(midi_json: MidiFile, sf_json: SFFile) {
    const context = manager.context;
    const master_gain = manager.master_gain;
    await context.resume();                         // 先に再開してから時刻を読む
    
    const player = new MIDIPlayer(context, master_gain, sf_json.presets, midi_json);
    manager.player = player;
   
    function scheduling() {
        const song_now = context.currentTime + player.time_offset;   // 曲の何秒目か
        const horizon = song_now + LOOKAHEAD;
	
        while( player.index < player.events.length ){
            const event = player.events[player.index];
            const start = calc_time(event.tick, player.time_table);
            if( start >= horizon ) break;                    // ここから先は次回

	    player.apply_event(player.index);
            player.index++;
        }
        if( player.index >= player.events.length ){
	    manager.context.suspend();
	    clearInterval(timer);
	}
	set_tune_slider(manager.player);
    }

    scheduling();
    const timer = setInterval(scheduling, INTERVAL);
}
