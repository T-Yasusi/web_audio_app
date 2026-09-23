import { midi_files,  sf_files } from './../global_vals.ts'
import context from './../web_audio/context.ts'

function click_play_button(e){
    const i = document.getElementById('sf_file').value;
    
    const midiNote = document.getElementById('midi_note_slider').value;
    const bank   = e.target.parentNode.parentNode.children[0].innerHTML;
    const midiNo = e.target.parentNode.parentNode.children[1].innerHTML;
    const preset = sf_files[i].data.presets.find(a => a.bank == bank && a.MIDInumber == midiNo);
    const vel = 0;
    
    const preset_zones = [];
    for( const zone of preset.zones ){
	if( is_match_zone(midiNote, vel, zone) ){
	    preset_zones.push(zone);
	}
    }
    //	console.log(preset_zones);
    
    const insts_zones = [];
    for( const pZone of preset_zones ){
	const zones = [];
	for( const zone of pZone.instrument.zones ){
	    if( is_match_zone(midiNote, vel, zone) ){
		zones.push(zone);
	    }
	}
	insts_zones.push(zones);
    }
    //	console.log('inst zones :', insts_zones);

    const gain = context.createGain();
    gain.connect(context.destination);
    const sources = []
    for( const a of insts_zones ){
	for( const zone of a ){
	    console.log(zone.sample);
	    const buffer = context.createBuffer(1, zone.sample.sample.length, zone.sample.sampling_rate);
	    const data = buffer.getChannelData(0);
	    for( let i=0; i<zone.sample.sample.length; i++ ){
		data[i] = zone.sample.sample[i];
	    }
	    const source = context.createBufferSource();
	    source.buffer = buffer;
	    source.loop = true;
	    source.playbackRate.value = 2**((midiNote - zone.sample.origin_pitch)/12);
	    source.loopStart = zone.sample.loop_start/zone.sample.sampling_rate;
	    source.loopEnd   = zone.sample.loop_end/zone.sample.sampling_rate;
	    sources.push(source);
	    source.connect(gain);
	}
    }
    sources.forEach(a=> a.start())
    
    e.target.innerHTML = '停止';
    
    e.target.addEventListener('click', ()=>{
	sources.forEach(a=> a.stop())
	gain.disconnect();
	e.target.innerHTML = '再生';
	e.target.addEventListener('click', click_play_button, { once: true});
    }, { once: true });   
}

export default (sf_file) => {
    const div = document.getElementById('sf_table');
    div.replaceChildren();
    const table = document.createElement('table');
    div.appendChild(table);    
    
    const tr = document.createElement('tr');
    tr.innerHTML = '<th>Bank <th>MIDI No <th>Name <th>';
    table.appendChild(tr);
    
    const presets = sf_file.presets.sort((a, b)=> a.bank - b.bank || a.MIDInumber - b.MIDInumber);
    for( const preset of presets ){
	let tr = document.createElement('tr');
	tr.innerHTML = `<td>${preset.bank} <td> ${preset.MIDInumber} <td> ${preset.name} <td>
                          <button class="sf_play">再生</button>
                       ` 
	table.appendChild(tr);
    }

    const elems = document.querySelectorAll('.sf_play');
    elems.forEach(a => {
	a.addEventListener('click', click_play_button, { once: true});
    });
}

function is_match_zone(midiNote, velocity, zone){
    let minKey=0, maxKey=127, minVel=0, maxVel=127;
    if( zone.generators.key_range ){
	minKey=zone.generators.key_range[0];
	maxKey=zone.generators.key_range[1];
    }
    if( zone.generators.vel_range ){
	minVel=zone.generators.vel_range[0];
	maxVel=zone.generators.vel_range[1];
    }
    return minKey <= midiNote && midiNote <= maxKey && minVel <= velocity && velocity <= maxVel;
}
