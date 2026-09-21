import { getString, getDword, getWord, getChar } from './get_xxx.ts'

export default (shdr, sdta) => {
    let samples=[];
    for( let i=0; i<shdr.data.length; i+=46 ){
        const start=getDword(shdr.data, i+20);
        const end=getDword(shdr.data, i+24);
	
        samples.push({
            name: getString(shdr.data, i, i+20),
            sample: getSampleData(sdta, start, end),
            loop_start: getDword(shdr.data, i+28),
            loop_end: getDword(shdr.data, i+32),
            sampling_rate: getDword(shdr.data, i+36),
            origin_pitch: shdr.data[i+40],
            correction: getChar(shdr.data, i+41),
            sample_link: getWord(shdr.data, i+42),
	    sample_type: getWord(shdr.data, i+44)
        });
    }
    return samples;
};

function getSampleData(sdta, start, end){
    const smpl=sdta.data[0];
    const sm24=sdta.data[1];
    let int_data=new Int16Array(new Uint8Array(smpl.data.subarray(2*start, 2*end)).buffer);
    let data=new Float32Array(int_data.length);
    
    if( sm24 ){
        let int_sm24=new Int8Array(new Uint8Array(sm24.data.subarray(start, end)).buffer);
        for( let i=0; i<int_data.length; i++ ) data[i]=(256*int_data[i]+int_sm24[i])/(32767.*256.); // Max of int16_t*uint8_t              
    }
    else for( let i=0; i<int_data.length; i++ ) data[i]=int_data[i]/32767.; // Max of int16_t                                              
    return data;
};
