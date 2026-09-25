import read_riff from './../read_riff.ts'
import parseSF from './../sf/parse.ts'
import { sf_files } from './../global_vals.ts'

const select = document.getElementById('sf_file');
for( const [i, sf_file] of sf_files.entries() ){
    const sf_data = parseSF(read_riff(new Uint8Array(await fetch(sf_file.path).then(a => a.arrayBuffer()))));
    sf_file.data = sf_data;
    const option = document.createElement('option');
    option.id = "sf_"+i;
    option.value = i;
    option.innerHTML = sf_data.info.name;
    select.appendChild(option)
}
