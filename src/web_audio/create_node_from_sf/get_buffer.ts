const buffers = new WeakMap<object, AudioBuffer>();
export default function get_buffer(context: AudioContext, sample: any) {
    let b = buffers.get(sample);
    if( !b ){
        b = context.createBuffer(1, sample.sample.length, sample.sampling_rate);
        b.copyToChannel(sample.sample, 0);
        buffers.set(sample, b);
    }
    return b;
}
