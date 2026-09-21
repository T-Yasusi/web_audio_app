export function read(file_path){
//    return fetch(file_path).then(function(response){
    return fetch(file_path).then(response=>{
        return response.arrayBuffer();
    }).then(arrayBuffer=>{
	const array=new Uint8Array(arrayBuffer);
	if( String.fromCharCode.apply("", array.subarray(0, 4))!=="RIFF" ) throw new Error(file_path+"はRIFFファイルではありません");
	if( get_size(array.subarray(4, 8))!==array.length-8 )
            throw new Error(file_path+"ファイルサイズが一致しません "+size+"  "+array.length);

        return riff_data(array);
    }
	   

	   
