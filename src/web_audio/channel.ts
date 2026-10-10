const SMOOTH = 0.005;                             // 変化をなめらかにする時定数(秒)。ステップ状だとプチノイズが出る
const concave = (v: number) => (v / 127) ** 2;    // SF2 既定のカーブ(ベロシティ、CC7、CC11 で共通)

export type Channel = ReturnType<typeof create_channel>;

export function create_channel(context: AudioContext, output: AudioNode) {
    const input = context.createGain();           // ボイスの出力先。CC7 × CC11 の音量
    input.connect(output);

    const pan = context.createConstantSource();   // CC10(-1〜1)。各ボイスの pan に足し込む
    const bend = context.createConstantSource();  // ピッチベンド(セント)。各ボイスの detune に足し込む
    pan.offset.value = 0;                         // 既定値は 1 なので、必ず 0 にする
    bend.offset.value = 0;
    pan.start();
    bend.start();

    // GM の初期値
    const state = { volume: 100, expression: 127, bend: 0, bend_range: 2, rpn_msb: 127, rpn_lsb: 127 };
    input.gain.value = concave(state.volume) * concave(state.expression);
    return { input, pan, bend, state };
}

// イベントの時刻 when(AudioContext の時刻)に効くように予約する
export function apply_event(ch: Channel, event: any, when: number) {
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
        else if( cc === 101 ) s.rpn_msb = value;
        else if( cc === 100 ) s.rpn_lsb = value;
        else if( cc === 6 && s.rpn_msb === 0 && s.rpn_lsb === 0 ){   // RPN 0: ピッチベンドの幅(半音)
            s.bend_range = value;
            update_bend(ch, when);
        }
    }
}

function update_bend(ch: Channel, when: number) {
    const cents = ch.state.bend / 8192 * ch.state.bend_range * 100;
    ch.bend.offset.setTargetAtTime(cents, when, SMOOTH);
}

export function dispose_channel(ch: Channel) {
    ch.pan.stop();
    ch.bend.stop();
}
