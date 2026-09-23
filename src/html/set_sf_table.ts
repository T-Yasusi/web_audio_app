export default (sf_file) => {
    const div = document.getElementById('sf_table');
    const table = document.createElement('table');
    div.appendChild(table);    
    
    const tr = document.createElement('tr');
    tr.innerHTML = '<th>Bank <th>MIDI No <th>Name <th>';
    table.appendChild(tr);
    
    const presets = sf_file.presets.sort((a, b)=> a.bank - b.bank || a.MIDInumber - b.MIDInumber);
    for( const preset of presets ){
	let tr = document.createElement('tr');
	tr.innerHTML = `<td>${preset.bank} <td> ${preset.MIDInumber} <td> ${preset.name} <td>
                          <button class="sf_play">再生</button>
                       ` 
	table.appendChild(tr);
    }

    const elems = document.querySelectorAll('.sf_play');
    elems.forEach(a => { a.addEventListener('click', (e)=>{
	const bank   = e.target.parentNode.parentNode.children[0].innerHTML;
	const midiNo = e.target.parentNode.parentNode.children[1].innerHTML;
	console.log(bank, midiNo);
    }) });    
}
