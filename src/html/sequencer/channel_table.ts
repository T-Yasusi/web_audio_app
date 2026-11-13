import draw_sequencer from './draw.ts'

const all_elem = document.getElementById('draw-all');
const track_elem = document.getElementById('draw-channel');

all_elem?.addEventListener('change', ()=> {
    if( track_elem )
        track_elem.style.display = (all_elem as HTMLInputElement).checked ? 'none' : 'block';
});
all_elem?.dispatchEvent(new Event('change'));

window.addEventListener('DOMContentLoaded', ()=>{
    const elem = document.getElementById('draw-channel');
    const table = document.createElement('table');
    
    elem?.appendChild(table);
    for( let i=0; i<16; i++ ){
	const tr = document.createElement('tr');
	tr.innerHTML = `<td>チャンネル ${i}<td id = "nnote-ch-${i}"><td><input type = "checkbox" id = "draw-${i}" checked>`
	table.appendChild(tr);
    }

    for( let i=0; i<16; i++ ){
	document.getElementById(`draw-${i}`)?.addEventListener('change', draw_sequencer);
    }
});

all_elem?.addEventListener('change', draw_sequencer);

