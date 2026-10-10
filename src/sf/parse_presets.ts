import parse_zones from './parse_zones.ts'

export default function parse_presets(preset_list, pbag, pmod, pgen, insts) {
    return preset_list.map(p => {
        const { bag_start, bag_end, ...rest } = p;
        const { zones, global_zone } =
            parse_zones(p.name, bag_start, bag_end, pbag, pmod, pgen, 'instrument');

        const obj = { ...rest, zones: [] };
        for( const { zone, ref } of zones ){
            const instrument = insts[ref];
            if( !instrument ) throw new Error(`${p.name}: 存在しないinstrumentです: ${ref}`);
            obj.zones.push({ ...zone, instrument });
        }
        if( global_zone ) obj.global_zone = global_zone;
        return obj;
    });
}
