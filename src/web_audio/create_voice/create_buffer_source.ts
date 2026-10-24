import type { Sample, InstZone, Instrument } from '../../sf/types.ts'

const inst_gen = (iz: InstZone, inst: Instrument, name: string) => iz.generators[name] ?? inst.global_zone?.generators[name];

export default function create_buffer_source(context: AudioContext, note: number,
					     sample: Sample, iz: InstZone, inst: Instrument, p: Record<string, number>){
    const source = context.createBufferSource();
    source.buffer = get_buffer(context, sample);
    
    // ピッチ(セント): ルートキー、scale_tuning、coarse/fine、サンプルの補正
    const root_gen = inst_gen(iz, inst, 'overriding_root_key');
    const root = (root_gen !== undefined && (root_gen as number) >= 0) ? root_gen as number
        : (sample.origin_pitch <= 127 ? sample.origin_pitch : 60);
    source.detune.value = (note - root) * p.scale_tuning + p.coarse_tune * 100 + p.fine_tune + sample.correction;
    
    // ループ(1: ループ, 3: ノートオフまでループ)
    const mode = (inst_gen(iz, inst, 'sample_modes') as number ?? 0) & 3;
    if( (mode === 1 || mode === 3) && sample.loop_end > sample.loop_start ){
        source.loop = true;
        source.loopStart = sample.loop_start / sample.sampling_rate;
        source.loopEnd = sample.loop_end / sample.sampling_rate;
    }

    return source;
}

const buffers = new WeakMap<object, AudioBuffer>();
function get_buffer(context: AudioContext, sample: Sample) {
    let b = buffers.get(sample);
    if( !b ){
//	console.log(sample);
        b = context.createBuffer(1, sample.sample.length, sample.sampling_rate);
        b.copyToChannel(sample.sample as Float32Array<ArrayBuffer>, 0);
        buffers.set(sample, b);
    }
    return b;
}
