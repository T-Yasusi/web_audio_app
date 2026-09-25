import parseMIDI from './../midi/parse.ts'
import post_parse from './../midi/post_parse.ts'
import { midi_files } from './../global_vals.ts'

const select = document.getElementById('midi_file');
for( const [i, midi_file] of midi_files.entries() ){
    const midi_data = post_parse(parseMIDI(new Uint8Array(await fetch(midi_file.path).then(a => a.arrayBuffer()))));
    midi_file.data = midi_data;

    const option = document.createElement('option');
    option.id = "midi_"+i;
    option.value = i;
    option.innerHTML = midi_file.name;
    select.appendChild(option)
}
