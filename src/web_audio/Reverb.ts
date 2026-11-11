import { REVERB_WET, REVERB_SECOND, REVERB_RT60, REVERB_PREDELAY, REVERB_DAMPING } from './parameters.ts'

class Reverb{
    input: GainNode;
    output: GainNode;
    conv: ConvolverNode;

    constructor(context: AudioContext, gain: GainNode, wet = REVERB_WET){
	this.input = context.createGain();
	this.output = context.createGain();
	this.output.gain.value = wet;
	this.conv = context.createConvolver();
	this.conv.buffer = make_impulse(context);

	this.input.connect(this.conv);
	this.conv.connect(this.output);
	this.output.connect(gain);
    }
}

export default Reverb;

// 指数減衰するステレオのノイズ。左右で別のノイズにすると広がりが出る
function make_impulse(context: AudioContext,
                      seconds = REVERB_SECOND, rt60 = REVERB_RT60, predelay = REVERB_PREDELAY, damping = REVERB_DAMPING) {
    const rate = context.sampleRate, len = Math.floor(rate * seconds);
    const buf = context.createBuffer(2, len, rate);
    for( let ch = 0; ch < 2; ch++ ){
        const d = buf.getChannelData(ch);
        let lp = 0;
        for( let i = 0; i < len; i++ ){
            const t = i / rate;
            if( t < predelay ){ d[i] = 0; continue; }            // 直接音と響きの間の小さな間
            const env = 10 ** (-3 * t / rt60);                    // rt60 秒で -60 dB
            const a = 1 - damping * Math.min(1, t / rt60);        // 時間とともに高域を落とす(暗くする)
            lp += a * ((Math.random() * 2 - 1) - lp);             // 1次ローパス
            d[i] = lp * env;
        }
    }
    return buf;
}
