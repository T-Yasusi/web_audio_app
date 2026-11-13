export default function get_is_draw(){
    const result = new Array<boolean>(16).fill(true);
    if( (document.getElementById('draw-all') as HTMLInputElement).checked ) return result;

    for( let i=0; i<16; i++ ){
	result[i] = (document.getElementById(`draw-${i}`) as HTMLInputElement).checked;
    }
    return result;
}
