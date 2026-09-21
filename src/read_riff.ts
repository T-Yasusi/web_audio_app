export default function read_riff(data){
    const array=new Uint8Array(data);
//    console.log(data)
//    console.log(String.fromCharCode.apply("", array.subarray(0, 4)))
    if( String.fromCharCode.apply("", array.subarray(0, 4))!=="RIFF" ) throw new Error("RIFFファイルではありません");
    if( get_size(array.subarray(4, 8))!==array.length-8 ) throw new Error("ファイルサイズが一致しません");

    console.log("File Size :", array.length-8);
    return riff_data(array);
    
    function riff_data(array){
        const id=String.fromCharCode.apply("", array.subarray(0, 4));
        const size=get_size(array.subarray(4, 8));

        if( id==="RIFF" || id==="LIST" ){
            let pos=12;
            const type=String.fromCharCode.apply("", array.subarray(8, 12));
            let data=[];
            while( pos<size+8 ){
                const child=riff_data(array.subarray(pos, array.length)); // 再帰
                data.push(child);
                pos+=8+child.size;
            }
            let	sum=0;
            for( let d of data ) sum+=d.size;
            sum+=8*data.length+4;
            if( sum!==size )  throw new Error(type+"チャンクのファイルサイズが一致しません "+size+"  "+sum);

            return { type: type, size: size, data: data };
        }
        else  return { type: id, size: size, data: array.subarray(8, 8+size) };
    }
}

function get_size(array){ return array[0]+256*array[1]+256*256*array[2]+256*256*256*array[3]; };
