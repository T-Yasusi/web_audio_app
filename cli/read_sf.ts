import { readFile } from "node:fs/promises";
import read_riff from "../src/read_riff.ts";
import parseSF from '../src/sf/parse.ts';
import dumpSF from '../src/sf/dump.ts';

const files = [ "public/soundfont/GeneralUser-GS.sf2", ];
//		"public/soundfont/FluidR3.sf3" ];

for( const file of files ){
    const data = await readFile(file);
    const riff = read_riff(data);
    const json = parseSF(riff);
    dumpSF(json);
}
