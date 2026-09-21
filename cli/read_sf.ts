import { readFile } from "node:fs/promises";
import read_riff from "../src/read_riff.ts";
import parseSF from '../src/sf/parse.ts';

// const data = await readFile("public/soundfount/GeneralUser-GS.sf2");
const data = await readFile("public/soundfount/FluidR3.sf3");

const riff = read_riff(data);
parseSF(riff);
