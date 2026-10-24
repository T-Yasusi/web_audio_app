import type { MidiFile } from '../midi/types.ts'
import type { SFFile } from '../sf/types.ts'
import MIDIPlayer from './MIDIPlayer.ts'

class Manager {
    context: AudioContext;
    master_gain: GainNode;
    midi_files: MidiFile[];
    sf_files: SFFile[];
    player?: MIDIPlayer;
    
    constructor(){
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.connect(this.context.destination);
	this.midi_files = new Array<MidiFile>();
	this.sf_files = new Array<SFFile>();
    }

    reconstruct(){
	this.context.close();
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.connect(this.context.destination);
    }
}

const manager = new Manager();

export default manager;
