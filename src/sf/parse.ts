import parse_info from './parse_info.ts';
import parse_samples from './parse_samples.ts';
import parse_inst_list from './parse_inst_list.ts';
import parse_insts from './parse_insts.ts';
import parse_preset_list from './parse_preset_list.ts';
import parse_presets from './parse_presets.ts';

// 子チャンクを type(葉ならID、LISTなら形式タイプ)で引く
function get_child(parent, type) {
    const child = parent.children.find(c => c.id === 'RIFF' || c.id === 'LIST'  ? c.type === type : c.id === type );
    if( !child ) throw new Error(`${parent.type} に ${type} チャンクがありません`);
    return child;
}

export default function parse_sf2(riff) {
    if( riff.type !== 'sfbk' ) throw new Error('SoundFontファイルではありません');

    const info = parse_info(get_child(riff, 'INFO'));
    if( info.sf_version.major !== 2 ) throw new Error('SoundFontのバージョンがサポート外です');

    const sdta = get_child(riff, 'sdta');    
    const pdta = get_child(riff, 'pdta');
    const chunk = type => get_child(pdta, type);

    const samples = parse_samples(chunk('shdr'), sdta);

    const inst_list = parse_inst_list(chunk('inst'));
    const insts = parse_insts(inst_list, chunk('ibag'), chunk('imod'), chunk('igen'), samples);

    const preset_list = parse_preset_list(chunk('phdr'));
    const presets = parse_presets(preset_list, chunk('pbag'), chunk('pmod'), chunk('pgen'), insts);

    return { info, presets };
}
