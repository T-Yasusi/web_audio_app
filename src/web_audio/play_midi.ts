import type { MidiFile } from '../midi/types.ts'
import type { SFFile } from '../sf/types.ts'

import manager from './manager.ts'
import calc_time from './calc_time.ts'
import MIDIPlayer from './MIDIPlayer.ts'

import { LOOKAHEAD, INTERVAL, TAIL } from './parameters.ts'

export default async function play_midi(midi_json: MidiFile, sf_json: SFFile) {
    const context = manager.context;
    await context.resume();                         // 先に再開してから時刻を読む
    
    const player = new MIDIPlayer(context, manager.master_gain, sf_json.presets, midi_json);
    manager.player = player;
    if( manager.timer !== undefined ) clearInterval(manager.timer);   // 前の曲のタイマーが残らないように
    const total = player.duration;

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
        // 全イベントを予約し終えても、余韻が鳴り終わるまでは止めない
        if( player.index >= player.events.length && song_now > total + TAIL ){
	    manager.context.suspend();
	    clearInterval(manager.timer);
	    manager.timer = undefined;
	}
    }

    scheduling();
    manager.timer = setInterval(scheduling, INTERVAL);
}
