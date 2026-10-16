import { concave, depth } from './util_funcs.ts'

export default function create_channel(context: AudioContext, output: AudioNode) {
    const input = context.createGain();           // ボイスの出力先。CC7 × CC11 の音量
    input.connect(output);

    const pan = context.createConstantSource();   // CC10(-1〜1)。各ボイスの pan に足し込む
    pan.offset.value = 0;                         // 既定値は 1 なので、必ず 0 にする
    pan.start();
    const bend = context.createConstantSource();  // ピッチベンド(セント)。各ボイスの detune に足し込む
    bend.offset.value = 0;
    bend.start();
    const vib = context.createConstantSource();
    vib.offset.value = 0;
    vib.start();
    const reverb_level = context.createConstantSource();
    reverb_level.offset.value = 0;
    reverb_level.start();

    // GM の初期値
    const state = { volume: 100, expression: 127,
                    bend: 0, bend_range: 2, rpn_msb: 127, rpn_lsb: 127,
                    mod: 0,        // CC1(モジュレーションホイール) 0〜127
                    pressure: 0,   // チャンネルプレッシャー 0〜127
                    reverb: 0,
                  };
    input.gain.value = concave(state.volume) * concave(state.expression);
    return { input, pan, bend, vib, reverb_level, state };
}
