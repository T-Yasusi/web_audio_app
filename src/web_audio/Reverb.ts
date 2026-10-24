class Reverb{
    input: GainNode;
    conv: ConvolverNode;

    constructor(context: AudioContext, output: GainNode, wet = 0.5){
	this.input = context.createGain();
	this.conv = context.createConvolver();
	this.conv.buffer = make_impulse(context);

	this.input.connect(this.conv);
	this.conv.connect(output);
    }
}

export default Reverb;

// 指数減衰するステレオのノイズ。左右で別のノイズにすると広がりが出る
function make_impulse(context: AudioContext,
                      seconds = 2.0, rt60 = 1.8, predelay = 0.02, damping = 0.6) {
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
