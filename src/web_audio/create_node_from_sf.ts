function get_params_from_generators(generators){
    return {
	init_attenuation: generators.init_attenuation ?? 0,
	pan: generators.  pan ?? 0,
	init_filter_Fc:   generators.init_filter_Fc ?? 0,
	init_filter_Q:    generators.init_filter_Q ?? 0,
	coarse_tune:      generators.coarse_tune ?? 0,
	fine_tune:        generators.fine_tune ?? 0,
	init_filter_Q:    generators.init_filter_Q ?? 0,
	delay_vol_env:    generators.delay_vol_env ?? 0,
	attack_vol_env:   generators.attack_vol_env ?? 0,
	hold_vol_env:     generators.hold_vol_env ?? 0,
	decay_vol_env:    generators.decay_vol_env ?? 0,
	sustain_vol_env:  generators.sustain_vol_env ?? 0,
	release_vol_env:  generators.release_vol_env ?? 0,
    }
}
function marge_params(param1, param2){
    const result = { ...param1 };

    for (const [key, value] of Object.entries(param2)) {
	result[key] = (result[key] ?? 0) + value;
    }

    return result;
}

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
//	console.log('preset_sonze', preset_zones[i].generators, preset_zones[i].generators.attenuation);
//	console.log(' bbb', preset_zones[i]);
	
	const preset_params = get_params_from_generators(preset_zones[i].generators);
//	console.log(preset_params);
	
        for( const zone of insts_zones[i] ){
//	    console.log(' ccc', zone);
	    //            console.log(zone.sample);
	    //	    console.log(zone.generators);
	    const inst_params = get_params_from_generators(zone.generators);
	    if( zone.generators.init_filter_Fc == null ) inst_params.init_filter_Fc=13500;
	    if( zone.generators.delay_vol_env == null   ) inst_params.delay_vol_env = -12000;
	    if( zone.generators.attack_vol_env == null  ) inst_params.attack_vol_env = -12000;
	    if( zone.generators.hold_vol_env == null    ) inst_params.hold_vol_env = -12000;
	    if( zone.generators.decay_vol_env == null   ) inst_params.decay_vol_env = -12000;
	    if( zone.generators.release_vol_env == null ) inst_params.release_vol_env = -12000;
	    
//	    console.log('inst_params', inst_params);

	    const params = marge_params(preset_params, inst_params);
	    
	    const source = createBufferSource(context, note, zone);
	    const gain = context.createGain();
	    const panner = context.createStereoPanner();
	    const filter = context.createBiquadFilter();
	    filter.type = "lowpass";

	    source.detune.value = 100*params.coarse_tune + params.fine_tune;
	    const base_gain = 10**(-params.init_attenuation*0.04/20);
	    // gain.gain.value=base_gain;
	    const sustain_gain = 10**(-params.sustain_vol_env*0.04/20);
	    const delay_time   =  2**(params.delay_vol_env/1200);
	    const attack_time  =  2**(params.attack_vol_env/1200);
	    const hold_time    =  2**(params.hold_vol_env/1200);
	    const decay_time   =  2**(params.decay_vol_env/1200);	   
	    const release_time =  2**(params.release_vol_env/1200);	    
	    gain.gain.setValueAtTime(0, start_time);
	    gain.gain.setValueAtTime(0, start_time + delay_time);
	    gain.gain.linearRampToValueAtTime(base_gain, start_time+delay_time+attack_time);
	    gain.gain.setValueAtTime(base_gain, start_time+delay_time+attack_time+hold_time);
	    gain.gain.linearRampToValueAtTime(base_gain*sustain_gain, start_time+delay_time+attack_time+hold_time+decay_time);
	    gain.gain.setValueAtTime(base_gain*sustain_gain, start_time+duration);
	    gain.gain.linearRampToValueAtTime(0, start_time+duration+release_time);
	    // console.log(params.delay_vol_env);
	    // console.log(params.attack_vol_env);
	    // console.log(params.hold_vol_env);
	    // console.log(params.decay_vol_env);
	    // console.log(params.release_vol_env);
	    
	    // console.log("base_gain : ", base_gain);
	    // console.log("sus gain : ", sustain_gain);
	    // console.log("delay_time : ", delay_time);
	    // console.log("attack_time : ", attack_time); 
	    // console.log("hold_time : ", hold_time);
	    // console.log("decay_time : ", decay_time);
	    // console.log("release_time : ", release_time);
	    
//	    throw new Error('tmp');
	    panner.pan.value = params.pan/500;
	    filter.frequency.value = 8.176 * 2 ** (params.init_filter_Fc/1200);
	    // to do : init_filter_Q impletemation
	    
	    source.connect(gain);
	    gain.connect(filter);
	    filter.connect(panner);

//	    throw new Error('tmp')
//	    console.log(-(inst_params.init_attenuation + preset_params.init_attenuation));
//	    console.log(10**(-(inst_params.init_attenuation + preset_params.init_attenuation)*0.04/20));
	    //	    console.log((inst_params.pan + preset_params.pan)/500);

	    
	
            panner.connect(marger);
	    //          console.log('aaa');
            // console.log(now + start_time, 0, Number(now) + Number(stop_time) + 10);
            // console.log(typeof context.currentTime+start_time, typeof 0, typeof (context.currentTime + stop_time));
            // console.log(typeof(context.currentTime));
            // console.log(typeof(start_time));
            // console.log(typeof(stop_time));
//	    throw new Error('tmp');
	    
            source.start(start_time, 0, duration+release_time);
            source.onended = () => {
                source.disconnect();
		gain.disconnect();
		filter.disconnect();
		panner.disconnect();
//		marger.disconnect();
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
