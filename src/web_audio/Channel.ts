import { SMOOTH } from './global_vals.ts'
import { concave, depth } from './util_funcs.ts'

export type ChannelState = {
    volume: number;
    expression: number;
    bend: number;
    bend_range: number;
    rpn_msb: number;
    rpn_lsb: number;
    mod: number;
    pressure: number;
    reverb: number;
    chorus: number;
    coarse_tune: number;   // 半音
    fine_tune: number;     // セント
    fine_msb: number;      // ファインチューニングの生の値(14bit の上位・下位)
    fine_lsb: number;
}

class Channel{
    input: GainNode;
    pan: ConstantSourceNode;
    bend: ConstantSourceNode;
    vib: ConstantSourceNode;
    state: ChannelState;

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
                       mod: 0, pressure: 0, reverb: 0, chorus: 0,
		       coarse_tune: 0, fine_tune: 0, fine_msb: 64, fine_lsb: 0 };
        // state と実際のゲインを一致させる(CC7 が来るまで食い違わないように)
        this.input.gain.value = concave(this.state.volume) * concave(this.state.expression);
        this.input.connect(output);
    }

    update_bend(time: number, value: number){
    this.state.bend = value;
    const cents = this.state.bend / 8192 * this.state.bend_range * 100
                + this.state.coarse_tune * 100 + this.state.fine_tune;
    this.bend.offset.setTargetAtTime(cents, time, SMOOTH);
    }
    
    update_vib(time: number){
	this.vib.offset.setTargetAtTime(depth(this.state), time, SMOOTH);
    }
    
    update_pressure(time: number, value: number){
	this.state.pressure = value;
	this.update_vib(time);
    }
    
    change_state(time: number, cc: number, value: number){
	if( cc === 1 ){ this.state.mod = value; this.update_vib(time); }
	else if( cc === 6 || cc === 38 ) this.data_entry(time, cc, value);
        else if( cc === 7 || cc === 11 ){
            if( cc === 7 ) this.state.volume = value; else this.state.expression = value;
            this.input.gain.setTargetAtTime(concave(this.state.volume) * concave(this.state.expression), time, SMOOTH);
        }
        else if( cc === 10 ) this.pan.offset.setTargetAtTime(Math.max(-1, (value - 64) / 63), time, SMOOTH);
        else if( cc === 91 ) this.state.reverb = value;
        else if( cc === 93 ) this.state.chorus = value;
        else if( cc === 101 ) this.state.rpn_msb = value;
        else if( cc === 100 ) this.state.rpn_lsb = value;
        else if( cc === 121 ) this.reset_state(time);
    }

    data_entry(time: number, cc: number, value: number){
	const { rpn_msb, rpn_lsb } = this.state;
	if( rpn_msb !== 0 ) return;
	if( rpn_lsb === 0 && cc === 6 ) this.state.bend_range = value;
	else if( rpn_lsb === 1 ){
            if( cc === 6 ) this.state.fine_msb = value; else this.state.fine_lsb = value;
            this.state.fine_tune = (((this.state.fine_msb << 7) | this.state.fine_lsb) - 8192) / 8192 * 100;
	}
	else if( rpn_lsb === 2 && cc === 6 ) this.state.coarse_tune = value - 64;
	else return;
	this.update_bend(time, this.state.bend);
    }
    
    reset_state(time: number){
        // コントローラのリセット(ボリュームとパンは戻さない)
        this.state.expression = 127;
        this.input.gain.setTargetAtTime(concave(this.state.volume) * concave(this.state.expression), time, SMOOTH);
        this.update_bend(time, 0);
	this.update_vib(time);
	
        this.state.rpn_msb = 127;
        this.state.rpn_lsb = 127;
        this.state.reverb = 0;
        this.state.chorus = 0;
    }

    reset_all(time: number){
	this.state.volume = 100;
	this.state.bend_range = 2;
	this.state.coarse_tune = 0; this.state.fine_tune = 0;     // RPN 1/2 を入れた場合
	this.state.fine_msb = 64;   this.state.fine_lsb = 0;
	this.pan.offset.setTargetAtTime(0, time, SMOOTH);
	this.reset_state(time);   // expression、ベンド、RPN の選択、リバーブ、コーラス、ホイール(CC1 を入れた場合)
    }
};

export default Channel;
