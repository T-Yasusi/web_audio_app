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
    finished = false;                         // 曲を最後まで鳴らし終えた
    volume = 1;                               // マスター音量(スライダーの値)。AudioContext を作り直しても引き継ぐ
    
    constructor(){
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.gain.value = this.volume;
	this.master_gain.connect(this.context.destination);
	this.midi_files = new Array<MidiFile>();
	this.sf_files = new Array<SFFile>();
    }

    reconstruct(){
	if( this.timer !== undefined ){ clearInterval(this.timer); this.timer = undefined; }   // 前の曲のスケジューラを止める
	this.player = undefined;
	this.finished = false;
	this.context.close();
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.gain.value = this.volume;
	this.master_gain.connect(this.context.destination);
    }
}

const manager = new Manager();

export default manager;
