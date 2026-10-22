import type { Inst, InstZone, Instrument, Sample } from './types.ts'
import type { RiffChunk } from '../read_riff.ts'
import parse_zones from './parse_zones.ts'

export default function parse_insts(inst_list: Inst[], ibag: RiffChunk, imod: RiffChunk, igen: RiffChunk, samples: Sample[]){
    return inst_list.map((inst: Inst) => {
        const { zones, global_zone } =
            parse_zones(inst.name, inst.bag_start, inst.bag_end, ibag, imod, igen, 'sample_id');

	const instrument : Instrument = { name: inst.name, zones: new Array<InstZone>() };
	
        for( const { zone, ref } of zones ){
            const sample = samples[ref as number];
            if( !sample ) throw new Error(`${inst.name}: 存在しないsample_idです: ${ref}`);
	    const obj : InstZone = { generators: zone.generators, modulators: zone.modulators, sample: sample };
	    instrument.zones.push(obj);
        }
        if( global_zone ) instrument.global_zone = global_zone;
        return instrument;
    });
}



