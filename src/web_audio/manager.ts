import type { MidiFile } from '../midi/types.ts'
import type { SFFile } from '../sf/types.ts'
import MIDIPlayer from './MIDIPlayer.ts'

class Manager {
    context: AudioContext;
    master_gain: GainNode;
    midi_files: MidiFile[];
    sf_files: SFFile[];
    player?: MIDIPlayer;
    timer?: ReturnType<typeof setInterval>;   // 先読みスケジューラのタイマー
    
    constructor(){
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.connect(this.context.destination);
	this.midi_files = new Array<MidiFile>();
	this.sf_files = new Array<SFFile>();
    }

    reconstruct(){
	if( this.timer !== undefined ){ clearInterval(this.timer); this.timer = undefined; }   // 前の曲のスケジューラを止める
	this.player = undefined;
	this.context.close();
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.connect(this.context.destination);
    }

    get finished(){ return this.player ? this.player.index >= this.player.events.length : false; }
    get onplaying(){ return this.player ? this.player.index <= this.player.events.length : false; }
}

const manager = new Manager();

export default manager;
