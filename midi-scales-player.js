var player = new Vue({
	el: '#app',
	data: {
		volume: 127, // general volume of the midi output
		speed: 2000, // play one note every x milliseconds
		note: 45, // the MIDI start note
		velocity: 127, // how hard the note hits
			
		scaleIntervalsList: [
			{ name: "Major", intervals: [2, 2, 1, 2, 2, 2, 1] },
			{ name: "Natural minor", intervals: [2, 1, 2, 2, 1, 2, 2] },
			{ name: "Melodic minor", intervals: [2, 1, 2, 2, 2, 2, 1] }
		],
	
		selectedScaleIntervals: [],
		scale: [],
		cadence: [],
		running: false
	},
	methods: {
		init: function(options, afterInit) {
			volume = options.volume;
			speed = options.speed;
			note = options.note;
			velocity = options.velocity;
			
			this.selectedScaleIntervals = this.scaleIntervalsList[0].intervals;
			
			MIDI.loadPlugin({
				soundfontUrl: "midi-js/examples/soundfont/",
				instrument: "acoustic_grand_piano",
				onprogress: function(state, progress) {
					console.log(state, progress);
				},
				onsuccess: function() {
					console.log("Init success!");
					MIDI.setVolume(0, this.volume);
					
					if (typeof(afterInit)  === "function") {
						afterInit();
					}
				}
			});
		},
		calculateScale: function (numberOfOctaves) {
			var scale = [this.note];
			var nextNote = this.note;
			for (var octave = 0; octave < numberOfOctaves; octave++) {
				for (var interval = 0; interval < this.selectedScaleIntervals.length; interval++) {
					nextNote += this.selectedScaleIntervals[interval];
					scale.push(nextNote);
				}
			}
			
			console.log("Scale: " + scale);
			return scale;
		},
		calculateCadence: function() {
			var scaleForCadence = this.calculateScale(2);
			var tonic = [scaleForCadence[0], scaleForCadence[2], scaleForCadence[4]];
			var subdominant = [scaleForCadence[3], scaleForCadence[5], scaleForCadence[7]];
			var dominant = [scaleForCadence[4], scaleForCadence[6], scaleForCadence[8]];
			
			return [tonic, subdominant, dominant, tonic];
		},
		getRandomNoteFromScale: function() {
			return this.scale[Math.floor(Math.random() * this.scale.length)];
		},
		playNotes: function(notesToPlay, noteNumber) {	
			var noteToPlay = notesToPlay[noteNumber];
		
			if (Array.isArray(noteToPlay)) {
				MIDI.chordOn(0, noteToPlay, velocity, 0);
				console.log("Playing chord " + noteToPlay + " (" + MIDI.noteToKey[noteToPlay[0]] + "," + MIDI.noteToKey[noteToPlay[1]] + "," + MIDI.noteToKey[noteToPlay[2]] + ")");
			} else if (typeof(noteToPlay) === "number") {
				MIDI.noteOn(0, noteToPlay, velocity, 0);
				console.log("Playing note " + noteToPlay + " (" + MIDI.noteToKey[noteToPlay] + ")");
			}
				
			setTimeout(() => {
				if (Array.isArray(noteToPlay)) {
					MIDI.chordOff(0, noteToPlay, 0);
				} else if (typeof(noteToPlay) === "number") {
					MIDI.noteOff(0, notesToPlay[noteNumber], 0);
				}		
				
				// Play next note/chord
				noteNumber++;			
				if (this.running && noteNumber < notesToPlay.length) {
					this.playNotes(notesToPlay, noteNumber);
				}
			}, this.speed);
		},
		start: function() {
			console.log("Started");
			this.running = true;

			this.cadence = this.calculateCadence();
			this.scale = this.calculateScale(1);
			
			var notesToPlay = this.cadence;
			
			// Add rest
			notesToPlay.push(null);
					
			for (var i = 0; i < 12; i++) {
				notesToPlay.push(this.getRandomNoteFromScale());
			}
			
			this.playNotes(notesToPlay, 0);
		},
		stop: function() {
			this.running = false;
			console.log("Stopped");
		}	
	}
});