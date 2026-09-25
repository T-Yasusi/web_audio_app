import read_riff from './../read_riff.ts'
import parseMIDI from './../midi/parse.ts'
import post_parseMIDI from './../midi/post_parse.ts'
import parseSF from './../sf/parse.ts'

// import set_sf_table from './set_sf_table.ts'
import const_midi from './../web_audio/const_midi.ts'

import { midi_files,  sf_files } from './../global_vals.ts'

document.getElementById('play_midi').addEventListener('click', ()=>{
    const midi_json = midi_files[document.getElementById('midi_file').value].data;
    const sf_json = sf_files[document.getElementById('sf_file').value].data;

    console.log(midi_json, sf_json);
    const_midi(midi_json, sf_json);
}, { once: true });
							




