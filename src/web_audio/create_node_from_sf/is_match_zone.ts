import type { InstZone, PresetZone } from '../../sf/types.ts'

export default function is_match_zone(midiNote: number, velocity: number, zone: InstZone | PresetZone) {
    let minKey = 0, maxKey = 127, minVel = 0, maxVel = 127;
    if( zone.generators.key_range ){
	const [ min, max ] = zone.generators.key_range as [ number, number ];
        minKey = min;
        maxKey = max;
    }
    if( zone.generators.vel_range ){
	const [ min, max ] = zone.generators.vel_range as [ number, number ];
        minVel = min;
        maxVel = max;
    }
    return minKey <= midiNote && midiNote <= maxKey && minVel <= velocity && velocity <= maxVel;
}
