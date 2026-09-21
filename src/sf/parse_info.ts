export default (chunk) => {
    const getString = (array, first, last) => String.fromCharCode.apply('', array.subarray(first, last).filter(a=>{ return a!==0; }));
    
    let info={};
    for( let a of chunk.data ){
        if( a.type==='ifil' ) info['sf_version']=1000*a.data[0]+100*a.data[1]+10*a.data[2]+a.data[3];
        else if( a.type==='isng' ) info['sound_engin']=getString(a.data, 0, a.size);
        else if( a.type==='INAM' ) info['name']=getString(a.data, 0, a.size);
        else if( a.type==='irom' ) info['ROM']=getString(a.data, 0, a.size);
        else if( a.type==='iver' ) info['rom_version']=1000*a.data[0]+100*a.data[1]+10*a.data[2]+a.data[3];
        else if( a.type==='ICRD' ) info['date']=getString(a.data, 0, a.size);
        else if( a.type==='IENG' ) info['designer']=getString(a.data, 0, a.size);
        else if( a.type==='IPRD' ) info['product']=getString(a.data, 0, a.size);
        else if( a.type==='ICOP' ) info['copy_right']=getString(a.data, 0, a.size);
        else if( a.type==='ICMT' ) info['comment']=getString(a.data, 0, a.size);
        else if( a.type==='ISFT' ) info['tool']=getString(a.data, 0, a.size);
        else throw new Error('Sound Font  Infoチャンク 不明な識別子があります '+a.type);
    }
    return info;
};

