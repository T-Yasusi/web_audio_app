import read_riff from './../read_riff.ts'
import parseSF from './../sf/parse.ts'
import { sf_files } from './../global_vals.ts'

const select = document.getElementById('sf_file');
for( const [i, sf_file] of sf_files.entries() ){
    const response = await fetch(sf_file.path);
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const riff = read_riff(bytes);
    const sf_data = parseSF(riff);
    
    sf_file.data = sf_data;
    const option = document.createElement('option');
    option.id = "sf_"+i;
    option.value = i;
    const info = sf_data.info as { name?: string };
    option.innerHTML = info.name ?? "";
    select!.appendChild(option);
}
