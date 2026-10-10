import { getWord, getGenerator, getModulator } from './get_xxx.ts'

export default (inst_list, ibag, imod, igen, samples) => {
    let bIndex=0;
    let gIndex=0;
    let mIndex=0;
    let insts=[];
    for( let i=0; i<inst_list.length; i++ ){
        let inst_obj={ name: inst_list[i].name, zones: [] };
        for( let j=bIndex; j<inst_list[i].Ndx; j++ ){
            let gNext=getWord(ibag.data, 4*(j+1));   // 次の要素のインデックスを読む。
            let mNext=getWord(ibag.data, 4*(j+1)+2);
	    
            let zone={ generators: {}, modulators: [] };
            for( let k=gIndex; k<gNext; k++ ){
                let gen=getGenerator(igen.data.subarray(4*k, 4*(k+1)));
                if( k===gNext-1 ){
                    if( j===bIndex && gen.name!=="sample_id" ){
                        if( zone.generators[gen.name] ) throw new Error("同じGenerator IDがあります");
                        zone.generators[gen.name]=gen.data;
                    }
                    else if( gen.name!=="sample_id" ) throw new Error("Generatorの最後がSample IDでありません");
                    else zone.sample=samples[gen.data];
                }
                else{
                    if( zone.generators[gen.name] ) throw new Error("同じGenerator IDがあります");
                    zone.generators[gen.name]=gen.data;
                }
            }
            for( let k=mIndex; k<mNext; k++ ){
                zone.modulators.push(getModulator(imod.data.subarray(10*k, 10*(k+1))));
            }

	    if( zone.modulators.length > 0){
		console.log('preset mods :', zone.modulators);
	    }
	    
            if( zone.sample ) inst_obj.zones.push(zone);
            else inst_obj.global_zone=zone;
            gIndex=gNext;
            mIndex=mNext;
        }
        bIndex=inst_list[i].Ndx;
        insts.push(inst_obj);
    }
    return insts
};
