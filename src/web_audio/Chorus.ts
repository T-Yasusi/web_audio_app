class Chorus{
    input: GainNode;
    output: GainNode;
    
    oscillator = Array<AudioNode>();

    constructor(context: AudioContext, gain: GainNode, voices = 3, base = 0.025, rate = 0.5, depth = 0.002, wet = 0.6){
	this.input = context.createGain();
	this.output = context.createGain();
	this.output.gain.value = wet;
	this.output.connect(gain);
		
	for( let i = 0; i < voices; i++ ){
            const delay = context.createDelay(0.1);
            delay.delayTime.value = base + i * 0.004;          // 本ごとに少しずらす

            const lfo = context.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = rate * (1 + 0.13 * i);       // 周波数も少しずらして、同期を避ける
            const amount = context.createGain();
            amount.gain.value = depth;                         // 揺れ幅(秒)
            lfo.connect(amount);
            amount.connect(delay.delayTime);                   // AudioParam に足し込まれる
            lfo.start(context.currentTime + i / (voices * rate));   // 開始をずらして位相をずらす

	    const pan = context.createStereoPanner();
            pan.pan.value = voices === 1 ? 0 : -1 + 2 * i / (voices - 1);   // 左→右に振り分け

	    this.input.connect(delay);
	    delay.connect(pan);
	    pan.connect(this.output);

	    this.oscillator.push(lfo);
	}
    }
}

export default Chorus;
