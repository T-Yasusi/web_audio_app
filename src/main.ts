import './style.css'

import load_sf_file from './html/load_sf_file.ts'
import load_midi_file from './html/load_midi_file.ts'
import load_test_midi from './html/load_test_midi.ts'
 
import './html/set_audio_context.ts'
import './html/sync_gain.ts'
import './html/play_midi.ts'
import './html/set_midi_info.ts'

await Promise.all([
    load_sf_file(),
    load_midi_file()
]);

if( import.meta.env.DEV ) load_test_midi();   // 開発サーバーのときだけ、テスト用 MIDI を追加

(document.getElementById('play_midi')! as HTMLButtonElement).disabled = false;
