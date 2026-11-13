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

    if( import.meta.env.DEV ) load_test_midi();   // 開発サーバーのときだけ、テスト用 MIDI を追加
}

import { test_songs } from '../midi/make_test.ts'

// テスト用 MIDI を、曲の選択肢に追加する。load_midi_file の後に呼ぶ(番号が manager.midi_files の添字になるため)
function load_test_midi(){
    const select = document.getElementById('midi_file') as HTMLSelectElement;

    for( const song of test_songs ){
        manager.midi_files.push(song.make());
        const option = document.createElement('option');
        option.value = String(manager.midi_files.length - 1);
        option.innerHTML = song.name;
        select.appendChild(option);
    }
    select.dispatchEvent(new Event('change'));
}
