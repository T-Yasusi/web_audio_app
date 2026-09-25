import context from './../web_audio/context.ts'

const elem_time = document.getElementById('audio_time');
const elem_status = document.getElementById('audio_status');

const elem_bl = document.getElementById('base_latency');
const elem_ol = document.getElementById('output_latency');

elem_status.addEventListener('click', (e)=>{
//    console.log('button click');
    if( context.state === 'running' ) context.suspend();
    else if( context.state === 'suspended' ) context.resume();
});

function loop(){
    elem_time.value = Math.floor(context.currentTime*100)/100;
    elem_status.innerHTML = context.state;
    elem_bl.value = context.baseLatency;
    elem_ol.value = context.outputLatency;

    requestAnimationFrame(loop);
}

loop();
