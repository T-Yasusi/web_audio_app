import type { RiffChunk } from '../read_riff.ts'
import type { Modulator } from './get_xxx.ts'
import type { PresetInfo } from './parse_preset_list.ts'
import type { Instrument } from './parse_insts.ts'
import parse_zones from './parse_zones.ts'

type Zone = {
    generators: Record<string, number | [ number, number ] | undefined>;
    modulators: Modulator[];
    instrument?: Instrument;
}

export type Preset = {
    name: string;
    MIDInumber: number;
    bank: number;
    zones: Zone[];
    global_zone?: Zone;
    library: number;
    genre: number;
    morphology: number;    
};

export default function parse_presets(preset_list: PresetInfo[], pbag: RiffChunk, pmod: RiffChunk, pgen: RiffChunk, insts: Instrument[]) {
    return preset_list.map((p: PresetInfo) => {
        const { bag_start, bag_end, ...rest } = p;
        const { zones, global_zone } =
            parse_zones(p.name, bag_start, bag_end, pbag, pmod, pgen, 'instrument');

	const preset : Preset = { ...rest,  zones: new Array<Zone>() };
//        const obj = { ...rest, zones: [] };
        for( const { zone, ref } of zones ){
            const instrument = insts[ref as number];
            if( !instrument ) throw new Error(`${p.name}: 存在しないinstrumentです: ${ref}`);
            preset.zones.push({ generators: zone.generators, modulators: zone.modulators , instrument: instrument });
        }
        if( global_zone ) preset.global_zone = global_zone;
        return preset;
    });
}
