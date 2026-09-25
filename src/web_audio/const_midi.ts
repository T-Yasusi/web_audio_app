import context from './context.ts'
import create_node_from_sf from './create_node_from_sf.ts'
import master_gain from './master_gain.ts'
import calc_time from './../midi/calc_time.ts'

export default (midi_json, sf_json) => {
    const base_time = context.currentTime;
    function scheduling(dtime = 3.0){
	const now = context.currentTime;
//	console.log('Scheduling  time = ', now);
	let bankID = 0;
	for( const track of midi_json.tracks ){
//	    console.log('===============================================');
	    const midiNumbers = new Array(127).fill(0);
	    //	console.log(presetNo);
	    for( const event of track ){
		if( event.type === 'ProgramChange' ){
		    midiNumbers[event.channel] = event.data;
		}
		if( event.type === 'note' && !event.isScheduled ) {
		    const start_time = calc_time(event.tick, midi_json);
		    const stop_time = calc_time(event.endTick, midi_json);
		    if( start_time < now+dtime ){
			const preset = sf_json.presets.find(a=> a.bank === bankID && a.MIDInumber === midiNumbers[event.channel]);	
			const gain = create_node_from_sf(context,
							 event.midi_note,
							 event.velocity,
							 start_time+base_time,
							 stop_time-start_time,
							 preset);
			gain.connect(master_gain);
			event.isScheduled = true;
		    }
		    //		console.log(context.currentTime);
		}
	    }
	}
    }
    scheduling();
    
    context.resume();
    setInterval(scheduling, 1000);
}

