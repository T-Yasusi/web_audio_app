import { SMOOTH } from './global_vals.ts'
import type { Controllers } from './create_note/modulator.ts'
import type DynamicVoice from './create_note/dynamic_voice.ts'

export type ChannelState = {
    bend: number;
    bend_range: number;
    rpn_msb: number;
    rpn_lsb: number;
    pressure: number;
    coarse_tune: number;   // 半音
    fine_tune: number;     // セント
    fine_msb: number;      // ファインチューニングの生の値(14bit の上位・下位)
    fine_lsb: number;
}

class Channel{
    input: GainNode;
    tune: ConstantSourceNode;     // RPN 1/2(ファイン、コース チューニング)のセント。ピッチベンドは、モジュレータ経由で音ごとに反映する
    state: ChannelState;
    cc: number[] = new Array(128).fill(0);          // コントローラ(CC)の現在値。モジュレータのソースになる
    voices = new Set<DynamicVoice>();               // 鳴っている音のうち、動的なモジュレータを持つもの
    
    constructor(context: AudioContext, output: AudioNode){
        this.input = context.createGain();
	this.tune = context.createConstantSource();
        this.tune.offset.value = 0;
        this.tune.start();
        this.state = { bend: 0, bend_range: 2, rpn_msb: 127, rpn_lsb: 127, pressure: 0,
		       coarse_tune: 0, fine_tune: 0, fine_msb: 64, fine_lsb: 0 };
        this.input.connect(output);
	this.cc[7] = 100; this.cc[10] = 64; this.cc[11] = 127;   // 既定値(音量 100、パン中央、エクスプレッション最大)
    }

    // ---- 動的なモジュレータを持つ音の登録と、コントローラ変化の通知 ----
    add_voice(v: DynamicVoice){ this.voices.add(v); }
    remove_voice(v: DynamicVoice){ this.voices.delete(v); }

    controllers(): Controllers {
        return { cc: this.cc, bend: this.state.bend, pressure: this.state.pressure, bend_range: this.state.bend_range };
    }

    // key のソースが変わった。それを使っている音を、計算し直す(time はコンテキストの時刻)
    private notify(time: number, key: string){
        if( this.voices.size === 0 ) return;
        const ctl = this.controllers();
        for( const v of this.voices ) if( v.uses(key) ) v.update(time, ctl, key);
    }
    
    update_bend(time: number, value: number){
	this.state.bend = value;
	this.notify(time, 'bend');
    }

    update_tuning(time: number){
        this.tune.offset.setTargetAtTime(this.state.coarse_tune * 100 + this.state.fine_tune, time, SMOOTH);
    }
        
    update_pressure(time: number, value: number){
	this.state.pressure = value;
	this.notify(time, 'pressure');
    }
    
    change_state(time: number, cc: number, value: number){
	this.cc[cc] = value;
        this.notify(time, `cc:${cc}`);
	// CC1(モジュレーションホイール)は、モジュレータ経由で音ごとに反映する(DynamicVoice)
	if( cc === 6 || cc === 38 ) this.data_entry(time, cc, value);
	// CC7(音量)、CC11(エクスプレッション)も、モジュレータ経由で、音ごとの減衰量として反映する(DynamicVoice)
	// CC10(パン)は、モジュレータ経由で音ごとに反映する(DynamicVoice)
	// CC91(リバーブ)、CC93(コーラス)は、モジュレータ経由で音ごとに反映する(DynamicVoice)
        else if( cc === 101 ) this.state.rpn_msb = value;
        else if( cc === 100 ) this.state.rpn_lsb = value;
        else if( cc === 121 ) this.reset_state(time);
    }

    data_entry(time: number, cc: number, value: number){
	const { rpn_msb, rpn_lsb } = this.state;
	if( rpn_msb !== 0 ) return;
	if( rpn_lsb === 0 && cc === 6 ){ this.state.bend_range = value; this.notify(time, 'bend_range'); }
	else if( rpn_lsb === 1 ){
            if( cc === 6 ) this.state.fine_msb = value; else this.state.fine_lsb = value;
            this.state.fine_tune = (((this.state.fine_msb << 7) | this.state.fine_lsb) - 8192) / 8192 * 100;
	    this.update_tuning(time);
	}
	else if( rpn_lsb === 2 && cc === 6 ){ this.state.coarse_tune = value - 64; this.update_tuning(time); }
    }
    
    reset_state(time: number){
        // コントローラのリセット(ボリュームとパンは戻さない)
	this.cc[11] = 127; this.notify(time, 'cc:11');   // エクスプレッションを最大に
        this.update_bend(time, 0);
        // モジュレーションホイールとプレッシャーを戻す
        this.cc[1] = 0; this.notify(time, 'cc:1');
        this.state.pressure = 0; this.notify(time, 'pressure');
	
        this.state.rpn_msb = 127;
        this.state.rpn_lsb = 127;
    }

    reset_all(time: number){
	this.cc[7] = 100; this.notify(time, 'cc:7');     // 音量を既定値に
	this.state.bend_range = 2;
	this.state.coarse_tune = 0; this.state.fine_tune = 0;     // RPN 1/2 を入れた場合
	this.state.fine_msb = 64;   this.state.fine_lsb = 0;
	this.update_tuning(time);
	this.cc[10] = 64; this.notify(time, 'cc:10');     // パンを中央へ
	this.reset_state(time);   // expression、ベンド、RPN の選択、リバーブ、コーラス、ホイール(CC1 を入れた場合)
    }
};

export default Channel;
