import type { Event, Note } from '../midi/types.ts'
import build_table from '../web_audio/build_table.ts'
import calc_time from '../web_audio/calc_time.ts'
import manager from '../web_audio/manager.ts'

document.getElementById('midi_file')!.addEventListener('change', (e) => {
    const midi_json = manager.midi_files[Number((e.target as HTMLInputElement).value)];						 
    
    const time_table = build_table(midi_json);
    const events = midi_json.tracks.flat().sort((a: Event, b: Event) => a.tick - b.tick);

    let time = 0;
    for( const event of events ){
	const start = calc_time(event.tick, time_table);
	const end = (event as Note).endTick ? calc_time((event as Note).endTick, time_table) : 0;
	time = Math.max(start, end, time);
    }
    
    (document.getElementById('tune_duration')! as HTMLInputElement).value = (Math.round(10*time)/10).toString();

    const notes = midi_json.tracks.flat().filter((a: Event) => a.type ==='note');
    (document.getElementById('notes')! as HTMLInputElement).value = notes.length.toString();
});

