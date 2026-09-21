import { getString, getWord } from './get_xxx.ts'

export default (inst) => {
    let insts=[];
    for( let i=0; i<inst.data.length; i+=22 ){
        insts.push({ name: getString(inst.data, i, i+20), Ndx: getWord(inst.data, i+22+20) }); // 次のinstのNdxを入れている。
    }
    return insts;
};

