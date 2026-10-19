import master_gain from './../web_audio/master_gain.ts'

const slider = document.getElementById('volume_slider');
const elem = document.getElementById('volume');

slider!.addEventListener('change', ()=>{
    (elem as HTMLInputElement).value = (slider as HTMLInputElement).value;
    master_gain.gain.value = Number((slider as HTMLInputElement).value);
})

elem!.addEventListener('change', ()=>{
    (slider as HTMLInputElement).value = (elem as HTMLInputElement).value;
    master_gain.gain.value = Number((elem as HTMLInputElement).value);
})

slider!.dispatchEvent(new Event('change'));
elem!.dispatchEvent(new Event('change'));
