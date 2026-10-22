import type { Instrument, PresetZone, Preset, PresetInfo } from './types.ts'
import type { RiffChunk } from '../read_riff.ts'
import parse_zones from './parse_zones.ts'

export default function parse_presets(preset_list: PresetInfo[], pbag: RiffChunk, pmod: RiffChunk, pgen: RiffChunk, insts: Instrument[]) {
    return preset_list.map((p: PresetInfo) => {
        const { bag_start, bag_end, ...rest } = p;
        const { zones, global_zone } =
            parse_zones(p.name, bag_start, bag_end, pbag, pmod, pgen, 'instrument');

	const preset : Preset = { ...rest,  zones: new Array<PresetZone>() };
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
