import parse_zones from './parse_zones.ts'

export default function parse_insts(inst_list: any, ibag: any, imod: any, igen: any, samples: any) {
    return inst_list.map((inst: any) => {
        const { zones, global_zone } =
            parse_zones(inst.name, inst.bag_start, inst.bag_end, ibag, imod, igen, 'sample_id');

        const obj = { name: inst.name, zones: Array<{ generators: {}, modulators: any[], sample: any}>(), global_zone: null as any };
        for( const { zone, ref } of zones ){
            const sample = samples[ref];
            if( !sample ) throw new Error(`${inst.name}: 存在しないsample_idです: ${ref}`);
	    const obj2 = { generators: zone.generators, modulators: zone.modulators, sample: sample };
            obj.zones.push(obj2);	    
        }
        if( global_zone ) obj.global_zone = global_zone;
        return obj;
    });
}



