import type { RiffChunk } from '../read_riff.ts'
import type { Sample } from './parse_samples.ts'
import type { Inst } from './parse_inst_list.ts'
import type { Modulator } from './get_xxx.ts'
import parse_zones from './parse_zones.ts'

type Zone = {
    generators: Record<string, number | [ number, number ] | undefined>;
    modulators: Modulator[];
    sample?: Sample;
}

export type Instrument = {
    name: string;
    zones: Zone[];
    global_zone?: Zone;
};

export default function parse_insts(inst_list: Inst[], ibag: RiffChunk, imod: RiffChunk, igen: RiffChunk, samples: Sample[]){
    return inst_list.map((inst: Inst) => {
        const { zones, global_zone } =
            parse_zones(inst.name, inst.bag_start, inst.bag_end, ibag, imod, igen, 'sample_id');

	const instrument : Instrument = { name: inst.name, zones: new Array<Zone>() };
	
        for( const { zone, ref } of zones ){
            const sample = samples[ref as number];
            if( !sample ) throw new Error(`${inst.name}: 存在しないsample_idです: ${ref}`);
	    const obj : Zone = { generators: zone.generators, modulators: zone.modulators, sample: sample };
	    instrument.zones.push(obj);
        }
        if( global_zone ) instrument.global_zone = global_zone;
        return instrument;
    });
}



