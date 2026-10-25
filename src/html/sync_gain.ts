import manager from './../web_audio/manager.ts'

const slider = document.getElementById('volume_slider');
const elem = document.getElementById('volume');

slider!.addEventListener('change', ()=>{
    const master_gain = manager.master_gain;
    (elem as HTMLInputElement).value = (slider as HTMLInputElement).value;
    manager.volume = Number((slider as HTMLInputElement).value);
    master_gain.gain.value = manager.volume;
})

elem!.addEventListener('change', ()=>{
    const master_gain = manager.master_gain;
    (slider as HTMLInputElement).value = (elem as HTMLInputElement).value;
    manager.volume = Number((elem as HTMLInputElement).value);
    master_gain.gain.value = manager.volume;
})

slider!.dispatchEvent(new Event('change'));
elem!.dispatchEvent(new Event('change'));
