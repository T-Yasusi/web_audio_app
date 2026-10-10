export default (context, note, vel, start_time, duration, preset) => {
    const merger = context.createGain();
    for( const preset_zone of preset.zones ){
        if( is_match_zone(note, vel, preset_zone) ){
	    for( const zone of preset_zone.instrument.zones ){
		if( is_match_zone(note, vel, zone) ){
		    const params = calc_params(zone.generators, preset_zone.instrument.global_zone, preset_zone.generators, preset.global_zone);
//		    console.log(zone.modulators);
//		    console.log(preset_zone.modulators);
		    if( zone.modulators.length > 0 ||
			preset_zone.modulators.length > 0 ){
			// preset_zone.instrument.global_zone != null ? preset_zone.instrument.global_zone.modulators.length > 0 ||
			// zone.instrument.global_zone !=null ? zone.instrument.global_zone.modulators.length > 0 ){
			throw new Error('tmp');
		    }

		    const release_time =  2**(params.release_vol_env/1200);
		    const source = createBufferSource(context, note, zone.sample);
		    const gain = context.createGain();
		    const panner = context.createStereoPanner();
		    const filter = context.createBiquadFilter();
		    filter.type = "lowpass";

		    source.detune.value = 100*params.coarse_tune + params.fine_tune;
		    set_envelope(gain, start_time, duration, params);
		    panner.pan.value = params.pan/500;
		    filter.frequency.value = 8.176 * 2 ** (params.init_filter_Fc/1200);
		    filter.Q.value = 10 ** (params.init_filter_Q/200);

		    source.connect(gain);
		    gain.connect(filter);
		    filter.connect(panner);
		    panner.connect(merger);

		    source.start(start_time, 0, duration+release_time);
		    source.onended = () => {
			source.disconnect();
			gain.disconnect();
			filter.disconnect();
			panner.disconnect();
		    }
		}
	    }
	}
    }
    return merger;
} 

function set_envelope(gain, start_time, duration, params){
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
}

function createBufferSource(context, note, sample){
    const buffer = context.createBuffer(1, sample.sample.length, sample.sampling_rate);
    const data = buffer.getChannelData(0);
    for( let i=0; i<sample.sample.length; i++ ){
        data[i] = sample.sample[i];
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.playbackRate.value = 2**((note - sample.origin_pitch)/12);
    source.loopStart = sample.loop_start/sample.sampling_rate;
    source.loopEnd   = sample.loop_end/sample.sampling_rate;
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

function calc_params(inst_gens, inst_global_gens, preset_gens, preset_global_gens){
    const result = {
	init_attenuation: inst_gens.init_attenuation ?? 0,
	pan:              inst_gens.pan ?? 0,
	init_filter_Fc:   inst_gens.init_filter_Fc ?? 13500,
	init_filter_Q:    inst_gens.init_filter_Q ?? 0,
	coarse_tune:      inst_gens.coarse_tune ?? 0,
	fine_tune:        inst_gens.fine_tune ?? 0,
	delay_vol_env:    inst_gens.delay_vol_env ?? -12000,
	attack_vol_env:   inst_gens.attack_vol_env ?? -12000,
	hold_vol_env:     inst_gens.hold_vol_env ?? -12000,
	decay_vol_env:    inst_gens.decay_vol_env ?? -12000,
	sustain_vol_env:  inst_gens.sustain_vol_env ?? 0,
	release_vol_env:  inst_gens.release_vol_env ?? -12000,
    }
    for (const [key, value] of Object.entries(result) ){
	result[key] = (preset_gens[key] ?? 0) + value;
    }
	
    if( inst_global_gens != null ){
	for (const [key, value] of Object.entries(result) ){
	    result[key] = (inst_global_gens[key] ?? 0) + value;
	}
    }
    if( preset_global_gens != null ){
	for (const [key, value] of Object.entries(result) ){
	    result[key] = (preset_global_gens[key] ?? 0) + value;
	}
    }
    
    return result;
}
