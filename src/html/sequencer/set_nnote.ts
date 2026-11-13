import type { Note } from '../../midi/types.ts'
import manager from '../../web_audio/manager.ts'

export default function set_nnote(){
    const midi_json = manager.midi_files[Number((document.getElementById('midi_file') as HTMLSelectElement).value)];
//    for( const e of midi_json.events ) console.log((e as Note).channel);
    
    for( let i = 0; i<16; i++ ){
        const nnote = midi_json.events.filter(e => (e as Note).channel === i).length;
        const elem = document.getElementById(`nnote-ch-${i}`);
        (elem as HTMLElement).innerHTML = ('ノート数:' + nnote).toString();
	
        if( nnote === 0 ){
            (elem as HTMLElement).parentElement!.style.display = 'none';
        }
	else {
	    (elem as HTMLElement).parentElement!.style.display = 'block';
	}
    }
}

setTimeout(set_nnote, 1000);
