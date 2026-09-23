import './style.css'
import heroImg from './assets/hero.png'
import typescriptLogo from './assets/typescript.svg'
import viteLogo from './assets/vite.svg'
import parseMIDI from './midi/parse.ts'
import parseSF from './sf/parse.ts'
import read_riff from './read_riff.ts'
import set_sf_table from './html/set_sf_table.ts'

const midi_files = await fetch("json/midi_file.json").then(a => a.json());
const sf_files = await fetch("json/sf_file.json").then(a => a.json());

{
    const select = document.getElementById('midi_file');
    for( const [i, midi_file] of midi_files.entries() ){
	const midi_data = parseMIDI(new Uint8Array(await fetch(midi_file.path).then(a => a.arrayBuffer())));
	midi_file.data = midi_data;
	
	const option = document.createElement('option');
	option.id = "midi_"+i;
	option.value = i;
	option.innerHTML = midi_file.name;
	select.appendChild(option)
    }
}

{
    const select = document.getElementById('sf_file');
    for( const [i, sf_file] of sf_files.entries() ){
	const sf_data = parseSF(read_riff(new Uint8Array(await fetch(sf_file.path).then(a => a.arrayBuffer()))));
	sf_file.data = sf_data;
	const option = document.createElement('option');
	option.id = "sf_"+i;
	option.value = i;
	option.innerHTML = sf_data.info.name;
	select.appendChild(option)
    }
}

set_sf_table(sf_files[0].data);
