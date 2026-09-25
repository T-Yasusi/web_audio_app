import read_riff from './../read_riff.ts'
import parseMIDI from './../midi/parse.ts'
import parseSF from './../sf/parse.ts'

import set_sf_table from './set_sf_table.ts'

import { midi_files,  sf_files } from './../global_vals.ts'

import const_midi from '../web_audio/const_midi.ts'

const slider = document.getElementById('midi_note_slider');
const span = document.getElementById('midi_note');

slider.addEventListener('change', ()=>{
    const val = slider.value;
    const a = Math.floor(val/12)-1;
    const b = val % 12;
    const str_list = [ 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B' ];

    span.innerHTML =  str_list[b]+a;
});

slider.dispatchEvent(new Event('change'));

let select = document.getElementById('midi_file');
for( const [i, midi_file] of midi_files.entries() ){
    const midi_data = parseMIDI(new Uint8Array(await fetch(midi_file.path).then(a => a.arrayBuffer())));
    midi_file.data = midi_data;

    const option = document.createElement('option');
    option.id = "midi_"+i;
    option.value = i;
    option.innerHTML = midi_file.name;
    select.appendChild(option)
}

select = document.getElementById('sf_file');
for( const [i, sf_file] of sf_files.entries() ){
    const sf_data = parseSF(read_riff(new Uint8Array(await fetch(sf_file.path).then(a => a.arrayBuffer()))));
    sf_file.data = sf_data;
    const option = document.createElement('option');
    option.id = "sf_"+i;
    option.value = i;
    option.innerHTML = sf_data.info.name;
    select.appendChild(option)
}

select.addEventListener('change', (e)=>{
    const no = e.target.value;
//    console.log(sf_files[no]);
    set_sf_table(sf_files[no].data);
});
select.dispatchEvent(new Event('change'));
