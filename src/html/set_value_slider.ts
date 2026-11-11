import manager from '../web_audio/manager.ts'
import { CHORUS_WET, REVERB_WET, CHORUS_DEPTH } from '../web_audio/parameters.ts'

const MAX_SCALE = 10;

function set_value_slider(value :number, input: HTMLInputElement, slider: HTMLInputElement){
    input.min   = (0).toString();
    input.step  = Math.min(0.01*MAX_SCALE * value, value).toString();
    input.max   = (MAX_SCALE * value).toString();
    input.value = value.toString();
    
    slider.min   = (0).toString();
    slider.step  = Math.min(0.01*MAX_SCALE * value, value).toString();
    slider.max   = (MAX_SCALE * value).toString();
    slider.value = value.toString();
    
    console.log(slider);
    input.addEventListener('change', ()=>{ slider.value = input.value; });
    slider.addEventListener('change', ()=>{ input.value = slider.value; });
}

document.getElementById('wave-form')?.addEventListener('change', (e)=>{
    if( manager.player ){
	manager.player.chorus.set_waveform((e.target as HTMLSelectElement).value as OscillatorType);
    }
});

set_value_slider(CHORUS_WET,
		 document.getElementById('chorus-wet') as HTMLInputElement,
		 document.getElementById('chorus-wet-slider') as HTMLInputElement);
set_value_slider(CHORUS_DEPTH,
		 document.getElementById('chorus-depth') as HTMLInputElement,
		 document.getElementById('chorus-depth-slider') as HTMLInputElement);

set_value_slider(REVERB_WET,
		 document.getElementById('reverb-wet') as HTMLInputElement,
		 document.getElementById('reverb-wet-slider') as HTMLInputElement);
		 
function animate(){
    if( manager.player ){
	manager.player.reverb.output.gain.value = Number((document.getElementById('reverb-wet') as HTMLInputElement).value);
	manager.player.chorus.output.gain.value = Number((document.getElementById('chorus-wet') as HTMLInputElement).value);
	manager.player.chorus.set_depth(Number((document.getElementById('chorus-depth') as HTMLInputElement).value));
    }
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
