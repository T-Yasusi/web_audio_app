// import create_channel from './create_channel.ts'
import { SMOOTH } from './global_vals.ts'
import { concave } from './util_funcs.ts'

class Channel{
    input: GainNode;
    pan: ConstantSourceNode;
    bend: ConstantSourceNode;
    vib: ConstantSourceNode;
    state: { volume: number, expression: number,
	     bend: number, bend_range: number, rpn_msb: number, rpn_lsb: number,
	     mod: number,
	     pressure: number,
	     reverb: number,
	     chorus: number }

    constructor(context: AudioContext, output: AudioNode){
	this.input = context.createGain();
	this.pan = context.createConstantSource();
	this.bend = context.createConstantSource();
	this.vib = context.createConstantSource();
	this.pan.offset.value = 0;
	this.bend.offset.value = 0;
	this.vib.offset.value = 0;
	this.pan.start();
	this.bend.start();
	this.vib.start();
	this.state = { volume: 100, expression: 127,
		       bend: 0, bend_range: 2, rpn_msb: 127, rpn_lsb: 127,
		       mod: 0, pressure:0, reverb: 0, chorus: 0 }; 	
	this.input.connect(output);
    }

    update_bend(time: number, value: number){
	this.state.bend = value;
	const cents = this.state.bend / 8192 * this.state.bend_range * 100;
	this.bend.offset.setTargetAtTime(cents, time, SMOOTH);
    }
    reset_state(time: number){
	// コントローラのリセット(ボリュームとパンは戻さない)
        this.state.expression = 127;
        this.input.gain.setTargetAtTime(concave(this.state.volume) * concave(this.state.expression), time, SMOOTH);
        this.state.bend = 0;
        this.update_bend(time, 0);
        this.state.rpn_msb = 127;
        this.state.rpn_lsb = 127;
        this.state.reverb = 0;
    }
};

export default Channel;
