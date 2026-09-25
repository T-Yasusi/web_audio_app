import master_gain from './../web_audio/master_gain.ts'

const slider = document.getElementById('volume_slider');
const elem = document.getElementById('volume');

slider.addEventListener('change', ()=>{
    elem.value = slider.value;
    master_gain.gain.value = slider.value;
})

elem.addEventListener('change', ()=>{
    slider.value = elem.value;
    master_gain.gain.value = elem.value;
})

slider.dispatchEvent(new Event('change'));
elem.dispatchEvent(new Event('change'));
