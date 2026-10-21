import audioContext from './../web_audio/context.ts'
import play_midi from './../web_audio/play_midi.ts'

import { midi_files,  sf_files } from './../global_vals.ts'

let current_midi_id = -1;
let current_sf_id = -1; 
document.getElementById('play_midi')!.addEventListener('click', (e)=>{
    let midi_id = Number((document.getElementById('midi_file') as HTMLSelectElement).value);
    let sf_id= Number((document.getElementById('sf_file') as HTMLSelectElement).value);
    
    if( audioContext.state === 'suspended' ){
	if( midi_id === current_midi_id && sf_id === current_sf_id ){
	    audioContext.resume();
	}
	else{
	    current_midi_id = midi_id;
	    current_sf_id = sf_id;
	    play_midi(midi_files[midi_id].data, sf_files[sf_id].data)
	}
	(e!.target as HTMLInputElement).innerHTML = '再生中';
    }
    else if( audioContext.state === 'running' ){
	(e!.target as HTMLInputElement).innerHTML = '停止';
	audioContext.suspend();
    }
});
							




