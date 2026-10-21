import parseMIDI from './../midi/parse.ts'
import post_parse from './../midi/post_parse.ts'
import calc_time from './../midi/calc_time.ts'
import { midi_files } from './../global_vals.ts'

const select = document.getElementById('midi_file');
for( const [i, midi_file] of midi_files.entries() ){
    const response = await fetch(midi_file.path);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const midi_data = post_parse(parseMIDI(bytes));

    midi_file.data = midi_data;

    const option = document.createElement('option');
    option.id = "midi_"+i;
    option.value = i;
    option.innerHTML = midi_file.name;
    select!.appendChild(option)

    const events = midi_file.data.tracks.flat().sort((a: any, b:any) => a.tick - b.tick);
    let time = 0;
    for( const event of events ){
	const start = calc_time(event.tick, midi_file.data);
	const end = event.endTick ? calc_time(event.endTick, midi_file.data) : 0;
	time = Math.max(start, end, time);
    }
    (document.getElementById('duration') as HTMLInputElement).value = String(time);
    (document.getElementById('n_note') as HTMLInputElement).value = events.filter((a: any) => a.type === 'note').length;
}
