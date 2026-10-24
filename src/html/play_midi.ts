import manager from './../web_audio/manager.ts'
import play_midi from './../web_audio/play_midi.ts'

import { midi_files,  sf_files } from './../global_vals.ts'

let current_midi_id = -1;
let current_sf_id = -1;
document.getElementById('play_midi')!.addEventListener('click', (e)=>{
    let context = manager.context;
    let midi_id = Number((document.getElementById('midi_file') as HTMLSelectElement).value);
    let sf_id= Number((document.getElementById('sf_file') as HTMLSelectElement).value);
    
    if( context.state === 'suspended' ){
	if( midi_id !== current_midi_id || sf_id !== current_sf_id ){
	    current_midi_id = midi_id;
	    current_sf_id = sf_id;

	    if( midi_id !== -1 || sf_id !== -1){
		manager.reconstruct();
		context = manager.context;
	    }		    
	    play_midi(midi_files[midi_id].data, sf_files[sf_id].data)
	}
	context.resume();
	(e!.target as HTMLInputElement).innerHTML = '再生中';
    }
    else if( context.state === 'running' ){
	(e!.target as HTMLInputElement).innerHTML = '停止';
	context.suspend();
    }
});
							




