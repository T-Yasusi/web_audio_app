import context from './../web_audio/context.ts'

const elem_time = document.getElementById('audio_time');
const elem_status = document.getElementById('audio_status');

const elem_bl = document.getElementById('base_latency');
const elem_ol = document.getElementById('output_latency');

function loop(){
    (elem_time as HTMLInputElement).value = String(Math.floor(context.currentTime*100)/100);
    (elem_status as HTMLInputElement).innerHTML = String(context.state);
    (elem_bl as HTMLInputElement).value = String(context.baseLatency);
    (elem_ol as HTMLInputElement).value = String(context.outputLatency);
    (elem_status as HTMLInputElement).innerHTML = String(context.state);
    
    requestAnimationFrame(loop);
}

loop();
