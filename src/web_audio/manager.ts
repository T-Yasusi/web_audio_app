const ctx = new AudioContext();
ctx.suspend();

class Manager {
    context: AudioContext;
    master_gain: GainNode;

    constructor(){
	this.context = new AudioContext();
	this.context.suspend();
	this.master_gain = this.context.createGain();
	this.master_gain.connect(this.context.destination);
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
