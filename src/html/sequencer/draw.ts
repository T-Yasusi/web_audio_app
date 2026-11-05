// import calc_time from '../../web_audio/calc_time.ts'
import type { MidiFile, Note } from '../../midi/types.ts'

export default function draw_sequencer(midi_json: MidiFile){
    const NS = 'http://www.w3.org/2000/svg';
    const createSVGElem = (name: string, attrs: Record<string, string | number>) => {
	const elem = document.createElementNS(NS, name);
	Object.entries(attrs).forEach(a=> elem.setAttribute(a[0], a[1].toString()));
	return elem;
    };
    
    const svg = document.getElementById('sequencer-svg');
    svg?.replaceChildren();
    const styles = window.getComputedStyle(svg as HTMLElement);
    const height = parseFloat(styles.height);
    const width  = parseFloat(styles.width);

    svg?.setAttribute('viewBox', `-${0.02*width} -${0.02*height} ${0.98*width} ${0.98*height}`);
    const max_tick = midi_json.events.reduce((v, a) => Math.max(a.tick, (a as Note).endTick ? (a as Note).endTick : 0, v), 0);
    const factorX = 0.95*width/max_tick;
    const factorY = 0.96*height/120;

    for( let x of [ 0, factorX*max_tick ] ){
	svg?.appendChild(createSVGElem('line', { x1: x, x2: x, y1: 24*factorY, y2: 120*factorY, stroke: 'black' }));
    }
    for( let i = 2; i<11; i++ ){
	svg?.appendChild(createSVGElem('line', { x1: 0, x2: 0.95*width, y1: 12*i*factorY, y2: 12*i*factorY, stroke: 'black' }));
    }
            
    for( const event of midi_json.events ){
	const note = event as Note;
	svg?.appendChild(createSVGElem('rect', { x: factorX * note.tick, y: factorY * (127 - note.midi_note),
						 width: factorX * (note.endTick - note.tick), height: factorY,
						 rx: 0.25 * factorX, ry: 0.25 * factorY,
						 fill: 'cyan', stroke: 'blue', strokeWidth: 1, fillOpacity: 0.5 }));
    }
}
