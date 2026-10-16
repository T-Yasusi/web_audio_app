import { SMOOTH } from './global_vals.ts'
import { concave, depth } from './util_funcs.ts'
import type Channel from './Channel.ts'

// イベントの時刻 when(AudioContext の時刻)に効くように予約する
export default function apply_event(ch: Channel, event: any, when: number) {
    const s = ch.state;

    if( event.type === 'pitchBend' ){
        s.bend = ((event.data[1] << 7) | event.data[0]) - 8192;      // -8192〜8191
        update_bend(ch, when);
    }
    else if( event.type === 'controlChange' ){
        const [cc, value] = event.data;
        if( cc === 7 || cc === 11 ){
            if( cc === 7 ) s.volume = value; else s.expression = value;
            ch.input.gain.setTargetAtTime(concave(s.volume) * concave(s.expression), when, SMOOTH);
        }
        else if( cc === 10 ) ch.pan.offset.setTargetAtTime(Math.max(-1, (value - 64) / 63), when, SMOOTH);
	else if( cc === 91 ) s.reverb = value;
        else if( cc === 101 ) s.rpn_msb = value;
        else if( cc === 100 ) s.rpn_lsb = value;
        else if( cc === 6 && s.rpn_msb === 0 && s.rpn_lsb === 0 ){   // RPN 0: ピッチベンドの幅(半音)
            s.bend_range = value;
            update_bend(ch, when);
        }
	else if( cc === 121 ){   // コントローラのリセット(ボリュームとパンは戻さない)
            s.expression = 127;
            ch.input.gain.setTargetAtTime(concave(s.volume) * concave(s.expression), when, SMOOTH);
	    s.bend = 0;
            update_bend(ch, when);
            s.rpn_msb = 127;
            s.rpn_lsb = 127;
	    s.reverb = 0;
        }
    }
}

function update_bend(ch: Channel, when: number) {
    const cents = ch.state.bend / 8192 * ch.state.bend_range * 100;
    ch.bend.offset.setTargetAtTime(cents, when, SMOOTH);
}

