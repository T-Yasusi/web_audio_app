export default function dump(json){
    console.log('===== MIDI File Dump ===============================================================================================');
    console.log('Format : ',json.format);
    console.log('Num of Track : ', json.ntrack);
    console.log('Division : ', json.division);    
    console.log('--------------------------------------------------------------------------------------------------------------------');
    for( const [ i, track ] of json.tracks.entries() ){
	const track_names = track.filter(a => a.event === 'Meta' && a.type === 'Track Name');
	const midi_events = track.filter(a => a.event === 'midi');
	//	console.log(track_names.length);
	let str = ` Track[${i}] : ${track_names.length === 1 ? track_names[0].data : 'No Name'}`.padEnd(30)
	    + `Num of MIDI : ', ${midi_events.length}`

	console.log(str);
    }
    console.log('====================================================================================================================');
}
