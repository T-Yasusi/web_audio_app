const concave = (v: number) => (v / 127) ** 2;    // SF2 既定のカーブ(ベロシティ、CC7、CC11 で共通)

const timecents = (tc: number) => 2 ** (tc / 1200);

export { concave, timecents }
