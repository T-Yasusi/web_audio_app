import check_chunk from './check_chunk.ts'

import parse_info from './parse_info.ts'
import parse_samples from './parse_samples.ts'
import parse_inst_list from './parse_inst_list.ts'
import parse_insts from './parse_insts.ts'
import parse_preset_list from './parse_preset_list.ts'
import parse_presets from './parse_presets.ts'

export default (riff) => {
    if( riff.type !== 'sfbk' ) throw new Error('Sound Fontファイルではありません');

    check_chunk(riff);
    const json = {};
    json.info = parse_info(riff.data[0]);
//    console.log(json);
    
    const samples = parse_samples(riff.data[2].data[8], riff.data[1]);
//    console.log(samples);
    const inst_list = parse_inst_list(riff.data[2].data[4]);
    const insts = parse_insts(inst_list, riff.data[2].data[5], riff.data[2].data[6], riff.data[2].data[7], samples);

    const preset_list = parse_preset_list(riff.data[2].data[0]);
    const presets = parse_presets(preset_list, riff.data[2].data[1], riff.data[2].data[2], riff.data[2].data[3], insts);

    json.presets = presets;
    return json;
};

