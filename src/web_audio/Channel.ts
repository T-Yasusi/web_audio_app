import { SMOOTH } from './global_vals.ts'
import { concave } from './util_funcs.ts'

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
                       mod: 0, pressure: 0, reverb: 0, chorus: 0 };
        // state と実際のゲインを一致させる(CC7 が来るまで食い違わないように)
        this.input.gain.value = concave(this.state.volume) * concave(this.state.expression);
        this.input.connect(output);
    }

    update_bend(time: number, value: number){
        this.state.bend = value;
        const cents = this.state.bend / 8192 * this.state.bend_range * 100;
        this.bend.offset.setTargetAtTime(cents, time, SMOOTH);
    }

    change_state(time: number, cc: number, value: number){
        if( cc === 6 && this.state.rpn_msb === 0 && this.state.rpn_lsb === 0 ){
            // RPN 0: ピッチベンドの幅(半音)。bend_range を更新し、現在のベンド量を再計算する
            this.state.bend_range = value;
            this.update_bend(time, this.state.bend);
        }
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

    reset_state(time: number){
        // コントローラのリセット(ボリュームとパンは戻さない)
        this.state.expression = 127;
        this.input.gain.setTargetAtTime(concave(this.state.volume) * concave(this.state.expression), time, SMOOTH);
        this.update_bend(time, 0);

        this.state.rpn_msb = 127;
        this.state.rpn_lsb = 127;
        this.state.reverb = 0;
        this.state.chorus = 0;
    }
};

export default Channel;
