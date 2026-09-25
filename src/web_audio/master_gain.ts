import context from './context.ts'

const gain = context.createGain();
gain.connect(context.destination);

export default gain;
