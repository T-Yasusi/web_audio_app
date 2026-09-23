const midi_files = await fetch("json/midi_file.json").then(a => a.json());
const sf_files = await fetch("json/sf_file.json").then(a => a.json());

export { midi_files, sf_files };

