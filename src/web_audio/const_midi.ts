import context from './context.ts'
import create_node_from_sf from './create_node_from_sf.ts'
import master_gain from './master_gain.ts'
import calc_time from './../midi/calc_time.ts'

import { create_channel, apply_event, dispose_channel } from './channel.ts'

const LOOKAHEAD = 3.0;   // 先読みする秒数
const INTERVAL = 1000;   // タイマーの間隔(ms)。先読みより短くする
const LEAD = 0.2;        // 再生開始までの余裕(秒)

export default async function play(midi_json, sf_json) {
    await context.resume();                         // 先に再開してから時刻を読む
    const base_time = context.currentTime + LEAD;   // 曲の0秒に対応するコンテキスト時刻
    
    // プリセットは (bank, program) で引く。なければ GM のバンク、さらになければ先頭へ
    const presets = new Map(sf_json.presets.map(p => [p.bank * 128 + p.MIDInumber, p]));
    const find_preset = (bank, program) => {
        const base = bank === 128 ? 128 : 0;
        return presets.get(bank * 128 + program) ?? presets.get(base * 128 + program) ?? presets.get(base * 128);
    };

    // 全トラックを tick 順にまとめる(安定ソートなので、同じ tick はファイルの順)
    const events = midi_json.tracks.flat().sort((a, b) => a.tick - b.tick);
    const program = new Array(16).fill(0);   // チャンネルごとのプログラム
    const bank = new Array(16).fill(0);      // チャンネルごとのバンク(CC0)
    const channels = Array.from({ length: 16 }, () => create_channel(context, master_gain));
    let index = 0;                           // 次に処理するイベント

    function scheduling() {
        const song_now = context.currentTime - base_time;   // 曲の何秒目か
        const horizon = song_now + LOOKAHEAD;
	
        while( index < events.length ){
            const event = events[index];
            const start = calc_time(event.tick, midi_json);
            if( start >= horizon ) break;                    // ここから先は次回
            index++;

            if( event.type === 'programChange' ) program[event.channel] = event.data;
            else if( event.type === 'controlChange' || event.type === 'pitchBend' ){
                if( event.type === 'controlChange' && event.data[0] === 0 ) bank[event.channel] = event.data[1];
                apply_event(channels[event.channel], event, base_time + start);   // 時刻に効くように予約
            }
            else if( event.type === 'note' ){
                if( start < song_now ) continue;             // 処理が遅れて過ぎてしまったノートは鳴らさない
                const preset = find_preset(event.channel === 9 ? 128 : bank[event.channel], program[event.channel]);
                if( !preset ) continue;
                const stop = calc_time(event.endTick, midi_json);
                const gain = create_node_from_sf(context, event.midi_note, event.velocity,
                                                 base_time + start, stop - start, preset, channels[event.channel],
						 { release_scale: event.release_scale, soft: event.soft });
                gain.connect(channels[event.channel].input);
            }
        }
        if( index >= events.length ) clearInterval(timer);
    }

    const timer = setInterval(scheduling, INTERVAL);
    scheduling();
    return { stop: () => { clearInterval(timer); channels.forEach(dispose_channel); } }   // 発音中のノートを止める処理は、別途必要
}
