import { readFile } from "node:fs/promises";
import parseMIDI from '../src/midi/parse.ts';
import dumpMIDI from '../src/midi/dump.ts';
import post_parse from '../src/midi/post_parse.ts';

const file_path = [
    "public/midi/EliteSyncopations.mid",
    "public/midi/PineappleRag.mid",
    "public/midi/PossumAndTaters.mid",
    "public/midi/Symphony7_1.mid",
    "public/midi/ToccataFugue.mid",
]

for( const path of file_path ){
    const data = await readFile(path);
    const midi = parseMIDI(data);
    dumpMIDI(midi);
    post_parse(midi);
}
