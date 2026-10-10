export default function is_match_zone(midiNote: number, velocity: number, zone: any) {
    let minKey = 0, maxKey = 127, minVel = 0, maxVel = 127;
    if( zone.generators.key_range ){
        minKey = zone.generators.key_range[0];
        maxKey = zone.generators.key_range[1];
    }
    if( zone.generators.vel_range ){
        minVel = zone.generators.vel_range[0];
        maxVel = zone.generators.vel_range[1];
    }
    return minKey <= midiNote && midiNote <= maxKey && minVel <= velocity && velocity <= maxVel;
}
