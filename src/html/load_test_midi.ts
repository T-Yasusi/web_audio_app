import { test_songs } from '../midi/make_test.ts'
import manager from '../web_audio/manager.ts'

// テスト用 MIDI を、曲の選択肢に追加する。load_midi_file の後に呼ぶ(番号が manager.midi_files の添字になるため)
export default function load_test_midi(){
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
