const SMOOTH = 0.005; // 変化をなめらかにする時定数(秒)。ステップ状だとプチノイズが出る
const REVERB_CC_MAX = 0.2;
const ATTEN_SCALE = 0.4;   // init_attenuation の係数(FluidSynth 互換。仕様の本文どおりなら 1.0)

export { SMOOTH, REVERB_CC_MAX, ATTEN_SCALE };
