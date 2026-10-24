import read_riff from './../read_riff.ts'
import parseSF from './../sf/parse.ts'
import manager from './../web_audio/manager.ts'

export default async function load_sf_file(){
    const sf_files = await fetch("json/sf_file.json").then(a => a.json());
    const select = document.getElementById('sf_file');
    
    for( const [i, sf_file] of sf_files.entries() ){
	const response = await fetch(sf_file.path);
	const buffer = await response.arrayBuffer();
	const bytes = new Uint8Array(buffer);
	const riff = read_riff(bytes);
	const sf_data = parseSF(riff);
	
	manager.sf_files.push(sf_data);
	const option = document.createElement('option');
	option.id = "sf_"+i;
	option.value = i;
	const info = sf_data.info as { name?: string };
	option.innerHTML = info.name ?? "";
	select!.appendChild(option);
    }
}
