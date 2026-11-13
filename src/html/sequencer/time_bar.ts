import type { Note } from '../../midi/types.ts'
import calc_time from '../../web_audio/calc_time.ts'
import manager from '../../web_audio/manager.ts'
import { wrap, width, factorY } from './consts.ts'
import createSVGElem from './createSVGElement.ts'

const time_bar = createSVGElem('line', { x1: 0, x2: 0, y1:0, y2: 96*factorY, stroke: 'blue', 'stroke-width': 5});
export default time_bar;

const set_x_at_time_bar = (x :number) =>{
    time_bar.setAttribute('x1', (x).toString());
    time_bar.setAttribute('x2', (x).toString());
    wrap!.scrollLeft = x;
}
const animate = () => {
    const player = manager.player;
//    console.log("finished :", manager.finished);
//    console.log("playing :", manager.onplaying);
    if( manager.finished ) set_x_at_time_bar(0.95*width);
    else if( !manager.onplaying ) set_x_at_time_bar(0);
    else if( player && player.events[player.index] ){
        const time = manager.context.currentTime + player.time_offset;
        let tick = 0;
        while( calc_time(tick, player.time_table) < time ) tick++;
        const max_tick = player.events.reduce((v, a) => Math.max(a.tick, (a as Note).endTick ? (a as Note).endTick : 0, v), 0);
//      console.log(tick, max_tick, tick/max_tick);
        set_x_at_time_bar(0.95*width*tick/max_tick);
    }
    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
