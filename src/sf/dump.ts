export default function dump(json: any){
    console.log('===== SF File Dump =================================================================================================');
    console.log('Name : ', json.info.name);
    console.log('   ver : ', json.info.sf_version);
    console.log('--------------------------------------------------------------------------------------------------------------------');
    const presets = [...json.presets].sort((a, b)=> a.bank - b.bank || a.MIDInumber - b.MIDInumber);
    for( const preset of presets ){
        console.log(` Bank : ${preset.bank} `.padEnd(15) +
            `MIDI No : ${preset.MIDInumber} `.padEnd(15) +
            `name : ${preset.name}`);
    }
//    console.log(json.info);
}
