export default (data) => {
    if( data.type!=='sfbk' ) throw new Error('Sound Fontファイルではありません');
    if( data.data.length!==3 ) throw new Error('Sound Fontファイル形式が不正です');
    if( data.data[0].type!=='INFO' ) throw new Error('Sound Fontの1つ目のチャンクはINFOであるべきです');
    if( data.data[1].type!=='sdta' ) throw new Error('Sound Fontの2つ目のチャンクはsdtaであるべきです');
    if( data.data[2].type!=='pdta' ) throw new Error('Sound Fontの3つ目のチャンクはpdtaであるべきです');
    
    if( data.data[1].data[0].type!=='smpl' ) throw new Error('sdtaチャンクの１つ目はsmplであるべきです');
    if( data.data[1].data[1]  && data.data[1].data[1].type!=='sm24' )
        throw new Error('sdtaチャンクのふたつ目のチャンクがsm24ではありません');
    if( data.data[2].data[0].type!=="phdr" ) throw new Error('pdtaのひとつ目のチャンクはphdrであるべきです');
    if( data.data[2].data[1].type!=="pbag" ) throw new Error('pdtaのひとつ目のチャンクはpbagであるべきです');
    if( data.data[2].data[2].type!=="pmod" ) throw new Error('pdtaのひとつ目のチャンクはpmodであるべきです');
    if( data.data[2].data[3].type!=="pgen" ) throw new Error('pdtaのひとつ目のチャンクはpgenであるべきです');
    if( data.data[2].data[4].type!=="inst" ) throw new Error('pdtaのひとつ目のチャンクはinstであるべきです');
    if( data.data[2].data[5].type!=="ibag" ) throw new Error('pdtaのひとつ目のチャンクはibagであるべきです');
    if( data.data[2].data[6].type!=="imod" ) throw new Error('pdtaのひとつ目のチャンクはimodであるべきです');
    if( data.data[2].data[7].type!=="igen" ) throw new Error('pdtaのひとつ目のチャンクはigenであるべきです');
    if( data.data[2].data[8].type!=="shdr" ) throw new Error('pdtaのひとつ目のチャンクはshdrであるべきです');
};
