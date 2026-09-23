import { midi_files,  sf_files } from './../global_vals.ts'

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
    elems.forEach(a => { a.addEventListener('click', (e)=>{
	const i = document.getElementById('sf_file').value;
	
	const midiNote = document.getElementById('midi_note_slider').value;
	const bank   = e.target.parentNode.parentNode.children[0].innerHTML;
	const midiNo = e.target.parentNode.parentNode.children[1].innerHTML;
	const preset = sf_files[i].data.presets.find(a => a.bank == bank && a.MIDInumber == midiNo);
	const vel = 0;
	
	const preset_zones = [];
	for( const zone of preset.zones ){
	    console.log(zone);
	    if( is_match_zone(midiNote, vel, zone) )  preset_zones.push(zone);
	}
	console.log(preset_zones);

	const insts_zones = [];
	for( const pZone of preset_zones ){
	    const zones = [];
	    for( const zone of pZone.instrument.zones ){
		console.log(zone)
		if( is_match_zone(midiNote, vel, zone) ){
		    console.log('true');
		    zones.push(zone);
		}
	    }
	    insts_zones.push(zones);
	}
	console.log('inst zones :', insts_zones);
    }) });    
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
