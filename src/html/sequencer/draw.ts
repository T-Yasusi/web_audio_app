import type { MidiFile, Note } from '../../midi/types.ts'
import calc_time from '../../web_audio/calc_time.ts'
import manager from '../../web_audio/manager.ts'

const NS = 'http://www.w3.org/2000/svg';
const createSVGElem = (name: string, attrs: Record<string, string | number>) => {
    const elem = document.createElementNS(NS, name);
    Object.entries(attrs).forEach(a=> elem.setAttribute(a[0], a[1].toString()));
    return elem;
};

const wrap = document.getElementById('svg-wrap');
const svg = document.getElementById('sequencer-svg');
const styles = window.getComputedStyle(svg as HTMLElement);
const height = parseFloat(styles.height);
const width  = parseFloat(styles.width);
const factorY = 0.96*height/120;
const time_bar = createSVGElem('line', { x1: 0, x2: 0, y1:0, y2: 96*factorY, stroke: 'blue', 'stroke-width': 5});
const animate = () => {
    const player = manager.player;
    if( player && player.events[player.index] ){
        const time = manager.context.currentTime + player.time_offset;
	let tick = 0;
	while( calc_time(tick, player.time_table) < time ) tick++;
	const max_tick = player.events.reduce((v, a) => Math.max(a.tick, (a as Note).endTick ? (a as Note).endTick : 0, v), 0);

//	console.log(tick, max_tick, tick/max_tick);
	time_bar.setAttribute('x1', (0.95*width*tick/max_tick).toString());
	time_bar.setAttribute('x2', (0.95*width*tick/max_tick).toString());
	wrap.scrollLeft = 0.95*width*tick/max_tick;

    }
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

export default function draw_sequencer(midi_json: MidiFile){    
    const max_tick = midi_json.events.reduce((v, a) => Math.max(a.tick, (a as Note).endTick ? (a as Note).endTick : 0, v), 0);
    const factorX = 0.95*width/max_tick;

    svg?.replaceChildren();
    svg?.setAttribute('viewBox', `${-0.02*width} ${-0.02*height} ${0.98*width} ${0.98*height}`);

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
    svg?.appendChild(time_bar);
    
    for( const event of midi_json.events ){
	const note = event as Note;
	svg?.appendChild(createSVGElem('rect', { x: factorX * note.tick, y: factorY * (127 - 24 - note.midi_note),
						 width: factorX * (note.endTick - note.tick), height: factorY,
						 rx: 0.25 * factorX, ry: 0.25 * factorY,
						 fill: 'cyan', stroke: 'blue', 'stroke-width': 1, fillOpacity: 0.5 }));
    }
}
