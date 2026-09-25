export default (json) => {
    for( const [ i, track ] of json.tracks.entries() ){
	const tempos = track.filter(a => a.event === 'Meta' && a.type === 'Set Tempo');
	if( tempos.length > 0 && i !== 0 ) throw new Error('TempoがTrack[0]以外に表れました');
    }
    const tempos = json.tracks[0].filter(a => a.event === 'Meta' && a.type === 'Set Tempo');

    const tracks = []
    for( let i=1; i<json.tracks.length; i++ ){
	const track = [];
	const noteOn_events = [];
	for( const event of json.tracks[i] ){
	    if( event.type === 'noteOn' ){
		if( event.data[1] > 0 ){
		    noteOn_events.push({ type: 'note',
					 channel: event.channel,
					 midi_note: event.data[0],
					 velocity: event.data[1],
					 tick: event.tick });
		}
		else if( event.data[1] === 0 ){
		    const id = noteOn_events.findIndex(a => a.midi_note === event.data[0] && a.channel === event.channel)
		    if( id<0 ){
//			console.log(event);
//			console.log(noteOn_events);
//			console.log('NoteOn vel=0: そのノートは鳴っていません');
			continue;
		    }
		    const obj = noteOn_events.splice(id, 1);
		    obj[0].endTick = event.tick;
		    track.push(obj[0]);		    
		}
	    }
	    else if ( event.type === 'noteOff' ){
		const id = noteOn_events.findIndex(a => a.midi_note === event.data[0] && a.channel === event.channel)
		if( id<0 ){
//		    console.log(event);
//		    console.log(noteOn_events)				
//		    console.log('NoteOff: そのノートは鳴っていません');
		    continue;
		}
		const obj = noteOn_events.splice(id, 1);
		obj[0].endTick = event.tick;
		track.push(obj[0]);
	    }
	    else if( event.event === 'midi' ) track.push(event);
	}
//	console.log(track.length);
	if( noteOn_events.length !== 0 ) throw new Error('鳴っているノートが残っています');
//	console.log(noteOn_events.length);
	//	throw new Error('tmp');
	track.sort((a, b)=> a.tick - b.tick);
	tracks.push(track);
    }
    const format = json.format, division = json.division;
    return { format, division, tempos, tracks };
}
