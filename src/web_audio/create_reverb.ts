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
}

export default function create_reverb(context: AudioContext, wet = 0.5) {
    const input = context.createGain();
    const conv = context.createConvolver();      // normalize は既定で true(IR の大きさを自動で整える)
    conv.buffer = make_impulse(context);
    const output = context.createGain();
    output.gain.value = wet;                        // 全体の響きの量(耳で調整)
    input.connect(conv);
    conv.connect(output);

    return { input, output }
}
