export default function create_filter_panner(context: AudioContext, p: Record<string, number>){
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 8.176 * 2 ** (p.init_filter_Fc / 1200);
    filter.Q.value = p.init_filter_Q / 10 - 3.01;   // cB → dB。Q=0 で共振なし(約 -3.01dB)
    
    const panner = context.createStereoPanner();
    panner.pan.value = p.pan / 500;

    return { filter, panner}
}
