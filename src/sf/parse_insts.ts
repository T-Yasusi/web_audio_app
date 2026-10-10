import parse_zones from './parse_zones.ts'

export default function parse_insts(inst_list, ibag, imod, igen, samples) {
    return inst_list.map(inst => {
        const { zones, global_zone } =
            parse_zones(inst.name, inst.bag_start, inst.bag_end, ibag, imod, igen, 'sample_id');

        const obj = { name: inst.name, zones: [] };
        for( const { zone, ref } of zones ){
            const sample = samples[ref];
            if( !sample ) throw new Error(`${inst.name}: 存在しないsample_idです: ${ref}`);
            obj.zones.push({ ...zone, sample });
        }
        if( global_zone ) obj.global_zone = global_zone;
        return obj;
    });
}



