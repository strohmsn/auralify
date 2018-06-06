var player = new Vue({
	el: '#app',
	data: {
		volume: 0, // general volume of the midi output
		speed: 0, // play one note every x milliseconds
		velocity: 0, // how hard the note hits
		
		rootNotes: [], // the root note for the scale
		
		scaleIntervalsList: [ // selectable scales
			{ name: "Major", intervals: [2, 2, 1, 2, 2, 2, 1] },
			{ name: "Natural minor", intervals: [2, 1, 2, 2, 1, 2, 2] },
			{ name: "Melodic minor", intervals: [2, 1, 2, 2, 2, 2, 1] },
			{ name: "Phrygian", intervals: [1, 2, 2, 2, 1, 2, 2] }
		],
			
		selectedRootNote: 0,
		selectedScaleIntervals: [],
		
		scale: [],
		cadence: [],
		
		playedNotes: [],
		
		running: false
	},
	methods: {
		init: function(options, afterInit) {
			this.volume = options.volume;
			this.speed = options.speed;
			this.velocity = options.velocity;
			
			this.rootNotes = [];
			for (var rootNote = 21; rootNote < 108; rootNote++) {
				this.rootNotes.push({ name: MIDI.noteToKey[rootNote], value: rootNote });
			}
			
			this.selectedRootNote = this.rootNotes[24];
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
			var scale = [this.selectedRootNote];
			var nextNote = this.selectedRootNote;
			for (var octave = 0; octave < numberOfOctaves; octave++) {
				for (var interval = 0; interval < this.selectedScaleIntervals.length; interval++) {
					nextNote = { name: MIDI.noteToKey[nextNote.value + this.selectedScaleIntervals[interval]], value: nextNote.value + this.selectedScaleIntervals[interval] };
					scale.push(nextNote);
				}
			}
			
			console.log("Scale: " + JSON.stringify(scale));
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
		
			if (noteToPlay && Array.isArray(noteToPlay)) {
				MIDI.chordOn(0, [noteToPlay[0].value, noteToPlay[1].value, noteToPlay[2].value], velocity, 0);
				// TODO: Add chords to played notes?
				console.log("Playing chord " + noteToPlay[0].name + "," + noteToPlay[1].name + "," + noteToPlay[2].name);
			} else if (noteToPlay && typeof(noteToPlay.value) === "number") {
				MIDI.noteOn(0, noteToPlay.value, velocity, 0);
				this.playedNotes.push(noteToPlay);
				console.log("Playing note " + noteToPlay.name);
			}
				
			setTimeout(() => {
				if (noteToPlay && Array.isArray(noteToPlay)) {
					MIDI.chordOff(0,[noteToPlay[0].value, noteToPlay[1].value, noteToPlay[2].value], 0);
				} else if (noteToPlay && typeof(noteToPlay.value) === "number") {
					MIDI.noteOff(0, notesToPlay[noteNumber].value, 0);
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
			this.playedNotes = [];
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
			this.playedNotes = [];
			console.log("Stopped");
		}	
	}
});