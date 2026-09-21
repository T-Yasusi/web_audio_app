import { getString, getWord, getDword } from './get_xxx.ts'

export default (phdr) => {
    let presets=[];
    for( let i=0; i<phdr.data.length; i+=38 ){
        presets.push({ name:       getString(phdr.data, i, i+20),
                       MIDInumber: getWord(phdr.data, i+20),
                       bank:       getWord(phdr.data, i+22),
                       Ndx:        getWord(phdr.data, i+38+24), // 次のphdrのNdxを入れている。
                       library:    getDword(phdr.data, i+26),
                       generator:  getDword(phdr.data, i+30),
                       morphology: getDword(phdr.data, i+34)
                     });
    }
    return presets
};
