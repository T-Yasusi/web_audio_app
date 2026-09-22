import { readFile } from "node:fs/promises";
import parseMIDI from '../src/midi/parse.ts';

const data = await readFile("public/midi/EliteSyncopations.mid");
const midi = parseMIDI(data);
