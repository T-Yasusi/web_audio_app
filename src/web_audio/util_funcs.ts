import type { ChannelState } from './Channel.ts'

const concave = (v: number) => (v / 127) ** 2;    // SF2 既定のカーブ(ベロシティ、CC7、CC11 で共通)

const VIB_CENTS = 50;
const depth = (s: ChannelState) => (s.mod / 127 + s.pressure / 127) * VIB_CENTS;
const timecents = (tc: number) => 2 ** (tc / 1200);

export { concave, depth, timecents }
