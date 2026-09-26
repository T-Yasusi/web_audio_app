export default (context, note, vel, start_time, duration, preset) => { 
    //    console.log(note, vel);
    const preset_zones = [];
    for( const zone of preset.zones ){
        if( is_match_zone(note, vel, zone) ){
            preset_zones.push(zone);
        }
    }
    //    console.log(preset_zones);
    
    const insts_zones = [];
    for( const pZone of preset_zones ){
        const zones = [];
        for( const zone of pZone.instrument.zones ){
            if( is_match_zone(note, vel, zone) ){
                zones.push(zone);
            }
        }
        insts_zones.push(zones);
    }
//    console.log(insts_zones);
  
    const marger = context.createGain();
    for( let i=0; i<insts_zones.length; i++ ){
	console.log('preset_sonze', preset_zones[i].generators, preset_zones[i].generators.attenuation);
	const preset_params = {
	    init_attenuation: preset_zones[i].generators.init_attenuation != null ? preset_zones[i].generators.init_attenuation : 0,
	    pan: preset_zones[i].generators.pan != null ? preset_zones[i].generators.pan : 0,
	    init_filter_Fc: preset_zones[i].generators.init_filter_Fc != null ? preset_zones[i].generators.init_filter_Fc : 0,
	    init_filter_Q: preset_zones[i].generators.init_filter_Q !=null ? preset_zones[i].generators.init_filter_Q : 0,
	}
	console.log(preset_params);
	
        for( const zone of insts_zones[i] ){
	    //            console.log(zone.sample);
//	    console.log(zone.generators);
	    const inst_params = {
		init_attenuation: zone.generators.init_attenuation != null ? zone.generators.init_attenuation : 0,
		pan: zone.generators.pan != null ? zone.generators.pan : 0,
		init_filter_Fc: zone.generators.init_filter_Fc != null ? zone.generators.init_filter_Fc : 13500,
		init_filter_Q: zone.generators.init_filter_Q !=null ? zone.generators.init_filter_Q : 0,
	    };
	
	    console.log('inst_params', inst_params);
	    const source = createBufferSource(context, note, zone);
	    const gain = context.createGain();
	    const panner = context.createStereoPanner();
	    const filter = context.createBiquadFilter();
	    filter.type = "lowpass";
	    source.connect(gain);
	    gain.connect(filter);
	    filter.connect(panner);

//	    console.log(-(inst_params.init_attenuation + preset_params.init_attenuation));
//	    console.log(10**(-(inst_params.init_attenuation + preset_params.init_attenuation)*0.04/20));
//	    console.log((inst_params.pan + preset_params.pan)/500);
//	    throw new Error('tmp')
	    
	    gain.gain.value = 10**(-(inst_params.init_attenuation + preset_params.init_attenuation)*0.04/20);
	    panner.pan.value = (inst_params.pan + preset_params.pan)/500;
	    filter.frequency.value = 8.176 * 2 ** ((inst_params.init_filter_Fc+preset_params.init_filter_Fc) / 1200);
	
            panner.connect(marger);
	    //          console.log('aaa');
            // console.log(now + start_time, 0, Number(now) + Number(stop_time) + 10);
            // console.log(typeof context.currentTime+start_time, typeof 0, typeof (context.currentTime + stop_time));
            // console.log(typeof(context.currentTime));
            // console.log(typeof(start_time));
            // console.log(typeof(stop_time));
//	    throw new Error('tmp');
	    
            source.start(start_time, 0, duration);
            source.onended = () => {
                source.disconnect();
		gain.disconnect();
		filter.disconnect();
		panner.disconnect();
		marger.disconnect();
		//              console.log('end : ', context.currentTime);
            }
        }
    }
    return marger;
} 

function createBufferSource(context, note, zone){
    const buffer = context.createBuffer(1, zone.sample.sample.length, zone.sample.sampling_rate);
    const data = buffer.getChannelData(0);
    for( let i=0; i<zone.sample.sample.length; i++ ){
        data[i] = zone.sample.sample[i];
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = 2**((note - zone.sample.origin_pitch)/12);
    source.loopStart = zone.sample.loop_start/zone.sample.sampling_rate;
    source.loopEnd   = zone.sample.loop_end/zone.sample.sampling_rate;
    return source;
}
    

function is_match_zone(midiNote, velocity, zone){
    let minKey=0, maxKey=127, minVel=0, maxVel=127;
    if( zone.generators.key_range ){
        minKey=zone.generators.key_range[0];
        maxKey=zone.generators.key_range[1];
    }
    if( zone.generators.vel_range ){
        minVel=zone.generators.vel_range[0];
        maxVel=zone.generators.vel_range[1];
    }
    return minKey <= midiNote && midiNote <= maxKey && minVel <= velocity && velocity <= maxVel;
}
