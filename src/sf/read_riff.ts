export type RiffChunk = { id: string; size: number; data: Uint8Array };
export type RiffList = {
    id: "RIFF" | "LIST";
    type: string; // 形式タイプ(sfbk, INFO, sdta, pdta など)
    size: number;
    children: RiffNode[];
};
export type RiffNode = RiffChunk | RiffList;

export default function readRiff(buffer: ArrayBuffer | Uint8Array): RiffList {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    
    const fourcc = (o: number) =>
	String.fromCharCode(bytes[o], bytes[o + 1], bytes[o + 2], bytes[o + 3]);
    
    function parse(offset: number): { node: RiffNode; next: number } {
	if (offset + 8 > bytes.length)
	    throw new Error(`オフセット ${offset}: チャンクヘッダが途切れています`);
	
	const id = fourcc(offset);
	const size = view.getUint32(offset + 4, true);
	const bodyStart = offset + 8;
	const bodyEnd = bodyStart + size;
	if (bodyEnd > bytes.length)
	    throw new Error(`${id} チャンクのサイズがファイル長を超えています`);
	
	const next = bodyEnd + (size % 2); // 奇数サイズ時のパディング
	
	if (id === "RIFF" || id === "LIST") {
	    if (size < 4) throw new Error(`${id} チャンクが短すぎます`);
	    const type = fourcc(bodyStart);
	    const children: RiffNode[] = [];
	    let pos = bodyStart + 4;
	    while (pos < bodyEnd) {
		const r = parse(pos);
		children.push(r.node);
		pos = r.next;
	    }
	    if (pos !== bodyEnd)
		throw new Error(`${type} チャンクの子のサイズ合計が一致しません`);
	    return { node: { id, type, size, children }, next };
	}
	
	return { node: { id, size, data: bytes.subarray(bodyStart, bodyEnd) }, next };
    }
    
    const { node } = parse(0);
    if (!("children" in node) || node.id !== "RIFF")
	throw new Error("RIFFファイルではありません");
    return node;
}
