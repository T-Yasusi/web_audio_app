import parseMIDI from './../midi/parse.ts'
import build_song from './../midi/build_song.ts'
import manager from './../web_audio/manager.ts'

export default async function load_midi_file(){
    const select = document.getElementById('midi_file');
    const midi_files = await fetch("json/midi_file.json").then(a => a.json());
    
    for( const [i, midi_file] of midi_files.entries() ){
	const response = await fetch(midi_file.path);
	const buffer = await response.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	const midi_data = build_song(parseMIDI(bytes));
	
	manager.midi_files.push(midi_data);
	
	const option = document.createElement('option');
	option.id = "midi_"+i;
	option.value = i;
	option.innerHTML = midi_file.name;
	select!.appendChild(option);
    
	(document.getElementById('midi_file')! as HTMLInputElement).dispatchEvent(new Event('change'))
    }
}
