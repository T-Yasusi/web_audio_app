import { getWord, getGenerator, getModulator } from './get_xxx.ts'

export default (preset_list, ibag, imod, igen, insts) => {
    let bIndex=0;
    let gIndex=0;
    let mIndex=0;
    let presets=[];
    for( let i=0; i<preset_list.length; i++ ){
        let preset_obj={ name:       preset_list[i].name,
                         MIDInumber: preset_list[i].MIDInumber,
                         bank:       preset_list[i].bank,
                         library:    preset_list[i].library,
                         generator:  preset_list[i].generator,
                         morphology: preset_list[i].morphology,
                         zones: [] };
        for( let j=bIndex; j<preset_list[i].Ndx; j++ ){
            let gNext=getWord(ibag.data, 4*(j+1));   // 次の要素のインデックスを読む。
            let mNext=getWord(ibag.data, 4*(j+1)+2);

            let zone={ generators: {}, modulators: [] };
            for( let k=gIndex; k<gNext; k++ ){
                let gen=getGenerator(igen.data.subarray(4*k, 4*(k+1)));
                if( k===gNext-1 ){
                    if( j===bIndex && gen.name!=="instrument" ){
                        if( zone.generators[gen.name] ) throw new Error("同じGenerator IDがあります");
                        zone.generators[gen.name]=gen.data;
                    }
                    else if( gen.name!=="instrument" ) throw new Error("Generatorの最後がinstrumntでありません");
                    else zone.instrument=insts[gen.data];
                }
                else{
                    if( zone.generators[gen.name] ) throw new Error("同じGenerator IDがあります");
                    zone.generators[gen.name]=gen.data;
                }
            }
            for( let k=mIndex; k<mNext; k++ ){
                zone.modulators.push(getModulator(imod.data.subarray(10*k, 10*(k+1))));
            }
	    
            if( zone.instrument ) preset_obj.zones.push(zone);
            else  preset_obj.global_zone=zone;
            gIndex=gNext;
            mIndex=mNext;
	}
	bIndex=preset_list[i].Ndx;
        if( preset_obj.name!=="EOP" ) presets.push(preset_obj);	
    }
    return presets;
}
