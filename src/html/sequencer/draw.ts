import type { Note } from '../../midi/types.ts'
import manager from '../../web_audio/manager.ts'
import { svg, height, width, factorY } from './consts.ts'
import './channel_table.ts'

import createSVGElem from './createSVGElement.ts'
import time_bar from './time_bar.ts'
import get_is_draw from './get_is_draw.ts'

export default function draw_sequencer(){
    const e = document.getElementById('midi_file');
    const midi_json = manager.midi_files[Number((e as HTMLInputElement).value)];
    
    const max_tick = midi_json.events.reduce((v, a) => Math.max(a.tick, (a as Note).endTick ? (a as Note).endTick : 0, v), 0);
    const factorX = 0.95*width/max_tick;

    svg?.replaceChildren();
    svg?.setAttribute('viewBox', `${-0.02*width} ${-0.02*height} ${0.98*width} ${0.98*height}`);
    draw_frame();
    svg?.appendChild(time_bar);

    const is_draw = get_is_draw();    
    for( const event of midi_json.events ){
	const note = event as Note;
	if( is_draw[note.channel] ){
	    svg?.appendChild(createSVGElem('rect', { x: factorX * note.tick, y: factorY * (127 - 24 - note.midi_note),
						     width: factorX * (note.endTick - note.tick), height: factorY,
						     rx: 0.25 * factorX, ry: 0.25 * factorY,
						     fill: 'cyan', stroke: 'blue', 'stroke-width': 1, fillOpacity: 0.5 }));    
	}
    }
    
    function draw_frame(){
	let tick = 0;
	while( tick <= max_tick ){
	    if( tick % (4*midi_json.division) === 0 ){
		svg?.appendChild(createSVGElem('line', { x1: factorX*tick, x2: factorX*tick, y1: 0, y2: 96*factorY, stroke: 'black' }));
	    }
	    else{
		svg?.appendChild(createSVGElem('line', { x1: factorX*tick, x2: factorX*tick, y1: 0, y2: 96*factorY, stroke: 'gray' }));
	    }
	    tick += midi_json.division;	
	}
	
	for( let i = 0; i<=12*8; i++ ){
	    if( i % 12 !== 0 )
		svg?.appendChild(createSVGElem('line', { x1: 0, x2: 0.95*width,
							 y1: i*factorY, y2: i*factorY, stroke: 'gray', 'stroke-width': 1 }));
	    else {
		svg?.appendChild(createSVGElem('line', { x1: 0, x2: 0.95*width,
							 y1: i*factorY, y2: i*factorY, stroke: 'black' }));
		const text = createSVGElem('text', { x:0 , y: i*factorY, 'text-anchor': 'end', 'dominant-baseline': 'middle' });
		text.innerHTML = `C${i/12}`;
		svg?.appendChild(text);
	    }
	}
    }
}

