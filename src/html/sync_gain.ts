import manager from './../web_audio/manager.ts'

const slider = document.getElementById('volume_slider');
const elem = document.getElementById('volume');

slider!.addEventListener('change', ()=>{
    const master_gain = manager.master_gain;
    (elem as HTMLInputElement).value = (slider as HTMLInputElement).value;
    master_gain.gain.value = Number((slider as HTMLInputElement).value);
})

elem!.addEventListener('change', ()=>{
    const master_gain = manager.master_gain;
    (slider as HTMLInputElement).value = (elem as HTMLInputElement).value;
    master_gain.gain.value = Number((elem as HTMLInputElement).value);
})

slider!.dispatchEvent(new Event('change'));
elem!.dispatchEvent(new Event('change'));
