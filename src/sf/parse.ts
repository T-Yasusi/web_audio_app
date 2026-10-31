import parse_info from './parse_info.ts';
import parse_samples from './parse_samples.ts';
import parse_inst_list from './parse_inst_list.ts';
import parse_insts from './parse_insts.ts';
import parse_preset_list from './parse_preset_list.ts';
import parse_presets from './parse_presets.ts';

import type { RiffNode, RiffChunk, RiffList } from './read_riff.ts'

// 子チャンクを type(葉ならID、LISTなら形式タイプ)で引く
function get_child(parent: RiffList, type: string) : RiffNode {
    const child = parent.children.find((c: RiffNode) => 'type' in c ? c.type === type : c.id === type );
    if( !child ) throw new Error(`${parent.type} に ${type} チャンクがありません`);
    return child;
}

export default function parse_sf2(riff: RiffList) {
    if( riff.type !== 'sfbk' ) throw new Error('SoundFontファイルではありません');

    const info = parse_info(get_child(riff, 'INFO') as RiffList);
    type SFInfo = {
	sf_version?: {
            major?: number;
	};
    };
    
    const major_version = (info as SFInfo).sf_version?.major ?? -1;
    if( major_version !== 2 ) throw new Error('SoundFontのバージョンがサポート外です');

    const sdta = get_child(riff, 'sdta');    
    const pdta = get_child(riff, 'pdta');
    const chunk = (type: string) => get_child(pdta as RiffList, type);

    const samples = parse_samples(chunk('shdr') as RiffChunk, sdta as RiffList);

    const inst_list = parse_inst_list(chunk('inst') as RiffChunk);
    const insts = parse_insts(inst_list, chunk('ibag') as RiffChunk, chunk('imod') as RiffChunk, chunk('igen') as RiffChunk, samples);

    const preset_list = parse_preset_list(chunk('phdr') as RiffChunk);
    const presets = parse_presets(preset_list, chunk('pbag') as RiffChunk, chunk('pmod') as RiffChunk, chunk('pgen') as RiffChunk, insts);


    return { info, presets };
}
